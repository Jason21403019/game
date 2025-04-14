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

    if ($udnmember && $um2) {
        // 檢查是否為 udn 會員
        $userLogin = getUdnMember($udnmember, $um2);
        if ($userLogin['response']['status'] === 'success') {
            // 取得會員簽到次數
            try {
                $sql = "SELECT * FROM act2024_bd_game2024_record WHERE udnmember = :udnmember OR email = :email";
                $stmt = $pdo->prepare($sql);
                $stmt->bindValue(':udnmember', $udnmember, PDO::PARAM_STR);
                $stmt->bindValue(':email', getMail(), PDO::PARAM_STR);
                $stmt->execute();
                $record = $stmt->fetch(PDO::FETCH_ASSOC);
            } catch (PDOException $e) {
                JSONReturn('連線異常，請稍後再試');
            }
            if ($record['count'] < 15) {
                $updateCount = (int)$record['count'] + 1;
                // 更新會員簽到次數
                if ($record['udnmember']) {
                    // 再次檢查當天是否簽到過
                    $signDate = date('Y-m-d', strtotime($record['signed_at']));
                    if ($today == $signDate) {
                        $logData = initLog("C02", "當天重複簽到", getUser());
                        insertFile($logData);
                        JSONReturn([
                            'message' => '您今天已完成簽到囉！',
                            'count' => (int)$record['count'],
                        ], true);
                    } else {
                        try {
                            $sql = "UPDATE act2024_bd_game2024_record SET count = :count, signed_at = NOW() WHERE udnmember = :udnmember";
                            $stmt = $pdo->prepare($sql);
                            $stmt->bindValue(':count', $updateCount, PDO::PARAM_INT);
                            $stmt->bindValue(':udnmember', $udnmember, PDO::PARAM_STR);
                            $stmt->execute();
                            JSONReturn([
                                'message' => '您今天已完成簽到囉！',
                                'count' => $updateCount,
                            ], true);
                        } catch (PDOException $e) {
                            $logData = initLog("C01-1", $e->getMessage(), getUser());
                            insertFile($logData);
                            JSONReturn('連線異常，請稍後再試');
                        }
                    }
                } else {
                    try {
                        $sql = "UPDATE act2024_bd_game2024_record SET udnmember = :udnmember, count = :count, signed_at = NOW() WHERE email = :email";
                        $stmt = $pdo->prepare($sql);
                        $stmt->bindValue(':count', $updateCount, PDO::PARAM_INT);
                        $stmt->bindValue(':udnmember', $udnmember, PDO::PARAM_STR);
                        $stmt->bindValue(':email', getMail(), PDO::PARAM_STR);
                        $stmt->execute();
                        JSONReturn([
                            'message' => '您今天已完成簽到囉！',
                            'count' => $updateCount,
                        ], true);
                    } catch (PDOException $e) {
                        $logData = initLog("C01-2", $e->getMessage(), getUser());
                        insertFile($logData);
                        JSONReturn('連線異常，請稍後再試');
                    }
                }
            }
        } else {
            JSONReturn('連線異常，請重新登入');
        }
    } else {
        JSONReturn('連線異常，請重新登入');
    }
}
