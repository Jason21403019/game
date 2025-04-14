<?php
require_once('./basic/base.php');

// 確認請求來源
if (isset($_SERVER['HTTP_REFERER'])) {
    $r = parse_url($_SERVER['HTTP_REFERER']);
    $refURL = $r["scheme"] . "://" . $r["host"] . $r["path"];
    if ($refURL == "https://event.udn.com/bd_game2024/") {
        header("access-control-allow-origin: https://event.udn.com");
    } elseif ($refURL == "https://lab-event.udn.com/bd_game2024/") {
        header("access-control-allow-origin: https://lab-event.udn.com");
    } else {
        JSONReturn('請重新操作');
    }
}

if (!isHttps()) {
    JSONReturn('請重新操作');
}

ini_set('session.gc_maxlifetime', 300);
session_set_cookie_params(300);

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $sanitizedData = filter_var(file_get_contents('php://input'), FILTER_SANITIZE_STRING, FILTER_FLAG_NO_ENCODE_QUOTES);
    $obj = json_decode($sanitizedData);
    $token = isset($obj->token) ? (string) postEmpty($obj->token) : null;
    $email = isset($obj->email) ? (string) postEmpty($obj->email) : null;
    $csrfToken = isset($obj->ctk) ? (string) postEmpty($obj->ctk) : null;

    // recaptcha 驗證
    $auth = checkRecaptchaAuth($token);
    if (!$auth) {
        JSONReturn('請重啟4G網路或Wifi後重新操作');
    }

    // csrf token 驗證
    session_start();
    if (!$csrfToken || ($_SESSION['csrf_token'] !== $csrfToken)) {
        JSONReturn('驗證失敗，請重整頁面再操作');
    }

    // 資料庫連線
    try {
        require_once('./basic/connectDB.php');
    } catch (PDOException $e) {
        JSONReturn('連線異常，請稍後再試');
    }

    // 取得會員 cookies
    $udnmember = $_COOKIE["udnmember"];
    $um2 = urlencode($_COOKIE["um2"]);

    // 取得當天日期
    $today = date('Y-m-d');

    if ($email) {
        // 檢查 email 格式
        if (!checkEmailFormat($email)) {
            JSONReturn('請輸入正確的email');
        } else {
            // 檢查當天是否重複參加
            try {
                $sql = "SELECT * FROM act2024_bd_game2024_record WHERE email = :email";
                $stmt = $pdo->prepare($sql);
                $stmt->bindValue(':email', $email, PDO::PARAM_STR);
                $stmt->execute();
                $record = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($record) {
                    $referDate = date('Y-m-d', strtotime($record['updated_at']));
                    if ($today == $referDate) {
                        JSONReturn([
                            'message' => '您今天已參加過囉！請明天再來',
                            'result' => $record['result'],
                            'great' => $record['great'],
                            'count' => 0,
                        ]);
                    }
                }
            } catch (PDOException $e) {
                JSONReturn('連線異常，請稍後再試');
            }
            // 檢查 email 是否註冊為 udn 會員
            $emailStatus = checkEmail($email);
            if ($emailStatus === '200') {
                JSONReturn('此email已註冊，請使用「會員帳號」參加');
            } elseif ($emailStatus != '200' && $emailStatus != '001' && $emailStatus != 'E00') {
                JSONReturn('請重新操作');
            } else {
                // 防止相同 IP 短時間內重複參加
                try {
                    $sqlChk = "SELECT COUNT(*) as count, MAX(updated_at) as last_update FROM act2024_bd_game2024_record WHERE ip = :ip AND DATE(updated_at) = CURDATE()";
                    $stmtChk = $pdo->prepare($sqlChk);
                    $stmtChk->bindValue(':ip', getIP(), PDO::PARAM_STR);
                    $stmtChk->execute();
                    $result = $stmtChk->fetch(PDO::FETCH_ASSOC);
                    if ($result) {
                        $ipCount = (int)$result['count'];
                        $lastUpdate = $result['last_update'];
                        $waitTime = strtotime($lastUpdate) + (60 * $ipCount);
                        $waitMinutes = ceil(($waitTime - time()) / 60);
                        if ($waitMinutes > 0) {
                            JSONReturn('系統繁忙，請稍後再試');
                        }
                    }
                } catch (PDOException $e) {
                    JSONReturn('系統異常，請稍後再試');
                }

                if ($record) {
                    JSONReturn([
                        'message' => '驗證成功可開始占卜',
                        'result' => $record['result'],
                        'great' => $record['great'],
                        'count' => 0,
                    ], true);
                } else {
                    JSONReturn([
                        'message' => '驗證成功可開始占卜',
                        'result' => '',
                        'great' => 0,
                        'count' => 0,
                    ], true);
                }
            }
        }
    } elseif ($udnmember && $um2) {
        // 檢查是否為 udn 會員
        $userLogin = getUdnMember($udnmember, $um2);
        if ($userLogin['response']['status'] === 'success') {
            // 檢查當天是否重複參加
            try {
                $sql = "SELECT * FROM act2024_bd_game2024_record WHERE udnmember = :udnmember OR email = :email";
                $stmt = $pdo->prepare($sql);
                $stmt->bindValue(':udnmember', $udnmember, PDO::PARAM_STR);
                $stmt->bindValue(':email', getMail(), PDO::PARAM_STR);
                $stmt->execute();
                $record = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($record) {
                    $referDate = date('Y-m-d', strtotime($record['updated_at']));
                    $signDate = date('Y-m-d', strtotime($record['signed_at']));
                    if ($today == $signDate) {
                        JSONReturn([
                            'message' => '您今天已參加過囉！請明天再來',
                            'result' => $record['result'],
                            'great' => $record['great'],
                            'count' => (int)$record['count'],
                        ]);
                    } else if ($today == $referDate) {
                        if ($record['count'] < 15) {
                            JSONReturn([
                                'message' => '今天尚未簽到',
                                'result' => $record['result'],
                                'great' => $record['great'],
                                'count' => (int)$record['count'],
                            ]);
                        } else {
                            JSONReturn([
                                'message' => '您今天已參加過囉！請明天再來',
                                'result' => $record['result'],
                                'great' => $record['great'],
                                'count' => (int)$record['count'],
                            ]);
                        }
                    } else {
                        // 防止相同 IP 短時間內重複參加
                        try {
                            $sqlChk = "SELECT COUNT(*) as count, MAX(updated_at) as last_update FROM act2024_bd_game2024_record WHERE ip = :ip AND DATE(updated_at) = CURDATE()";
                            $stmtChk = $pdo->prepare($sqlChk);
                            $stmtChk->bindValue(':ip', getIP(), PDO::PARAM_STR);
                            $stmtChk->execute();
                            $result = $stmtChk->fetch(PDO::FETCH_ASSOC);
                            if ($result) {
                                $ipCount = (int)$result['count'];
                                $lastUpdate = $result['last_update'];
                                $waitTime = strtotime($lastUpdate) + (60 * $ipCount);
                                $waitMinutes = ceil(($waitTime - time()) / 60);
                                if ($waitMinutes > 0) {
                                    JSONReturn('系統繁忙，請稍後再試');
                                }
                            }
                        } catch (PDOException $e) {
                            JSONReturn('系統異常，請稍後再試');
                        }
                        
                        JSONReturn([
                            'message' => '驗證成功可開始占卜',
                            'result' => $record['result'],
                            'great' => $record['great'],
                            'count' => (int)$record['count'],
                        ], true);
                    }
                } else {
                    // 防止相同 IP 短時間內重複參加
                    try {
                        $sqlChk = "SELECT COUNT(*) as count, MAX(updated_at) as last_update FROM act2024_bd_game2024_record WHERE ip = :ip AND DATE(updated_at) = CURDATE()";
                        $stmtChk = $pdo->prepare($sqlChk);
                        $stmtChk->bindValue(':ip', getIP(), PDO::PARAM_STR);
                        $stmtChk->execute();
                        $result = $stmtChk->fetch(PDO::FETCH_ASSOC);
                        if ($result) {
                            $ipCount = (int)$result['count'];
                            $lastUpdate = $result['last_update'];
                            $waitTime = strtotime($lastUpdate) + (60 * $ipCount);
                            $waitMinutes = ceil(($waitTime - time()) / 60);
                            if ($waitMinutes > 0) {
                                JSONReturn('系統繁忙，請稍後再試');
                            }
                        }
                    } catch (PDOException $e) {
                        JSONReturn('系統異常，請稍後再試');
                    }

                    JSONReturn([
                        'message' => '驗證成功可開始占卜',
                        'result' => '',
                        'great' => 0,
                        'count' => 0,
                    ], true);
                }
            } catch (PDOException $e) {
                JSONReturn('連線異常，請稍後再試');
            }
        } else {
            JSONReturn('請重新登入');
        }
    } else {
        JSONReturn('請重新登入');
    }
}
