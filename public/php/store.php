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

    // 取得隨機占卜結果
    $fortuneArr = [
        'great' => 1,
        'middle' => 5,
        'small' => 9,
        'normal' => 5
    ];
    $total = 20;
    $fortuneRand = getSecureRandomRangedValue(20, 1);
    $accumulation = 0;
    $result = '';
    $greatInit = 0;
    foreach ($fortuneArr as $key => $value) {
        $accumulation += $value;
        if ($accumulation >= $fortuneRand) {
            $result = $key;
            break;
        }
    }
    if (!$result) {
        JSONReturn('系統異常，請稍後再試');
    } elseif ($result == 'great') {
        $greatInit = 1;
    }

    // 取得會員 cookies
    $udnmember = $_COOKIE["udnmember"];
    $um2 = urlencode($_COOKIE["um2"]);

    if ($email) {
        // 檢查 email 格式
        if (!checkEmailFormat($email)) {
            JSONReturn('請輸入正確的email');
        } else {
            // 檢查是否有紀錄
            try {
                $sql = "SELECT * FROM act2024_bd_game2024_record WHERE email = :email";
                $stmt = $pdo->prepare($sql);
                $stmt->bindValue(':email', $email, PDO::PARAM_STR);
                $stmt->execute();
                $record = $stmt->fetch(PDO::FETCH_ASSOC);
            } catch (PDOException $e) {
                JSONReturn('連線異常，請稍後再試');
            }
            if ($record) {
                // 更新資料
                if ($record['great'] == 1) {
                    $greatInit = 1;
                }
                try {
                    $sql = "UPDATE act2024_bd_game2024_record SET result = :result, great = :great, updated_at = NOW() WHERE email = :email";
                    $stmt = $pdo->prepare($sql);
                    $stmt->bindValue(':email', $email, PDO::PARAM_STR);
                    $stmt->bindValue(':result', $result, PDO::PARAM_STR);
                    $stmt->bindValue(':great', $greatInit, PDO::PARAM_INT);
                    $stmt->execute();
                    JSONReturn([
                        'message' => '您今天已完成占卜',
                        'result' => $result,
                        'great' => $greatInit,
                        'count' => 0,
                    ], true);
                } catch (PDOException $e) {
                    $logData = initLog("S01", $e->getMessage(), getUser());
                    insertFile($logData);
                    JSONReturn('連線異常，請稍後再試');
                }
            } else {
                // 新增資料
                try {
                    $sql = "INSERT INTO act2024_bd_game2024_record (email, result, great, ip) VALUES (:email, :result, :great, :ip)";
                    $stmt = $pdo->prepare($sql);
                    $stmt->bindValue(':email', $email, PDO::PARAM_STR);
                    $stmt->bindValue(':result', $result, PDO::PARAM_STR);
                    $stmt->bindValue(':great', $greatInit, PDO::PARAM_INT);
                    $stmt->bindValue(':ip', getIP(), PDO::PARAM_STR);
                    $stmt->execute();
                    JSONReturn([
                        'message' => '您今天已完成占卜',
                        'result' => $result,
                        'great' => $greatInit,
                        'count' => 0,
                    ], true);
                } catch (PDOException $e) {
                    $logData = initLog("S02", $e->getMessage(), getUser());
                    insertFile($logData);
                    JSONReturn('新增異常，請稍後再試');
                }
            }
        }
    } elseif ($udnmember && $um2) {
        // 檢查是否為 udn 會員
        $userLogin = getUdnMember($udnmember, $um2);
        if ($userLogin['response']['status'] === 'success') {
            // 檢查是否有紀錄
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
            if ($record) {
                // 更新資料
                if ($record['great'] == 1) {
                    $greatInit = 1;
                }
                if($record['udnmember']) {
                    try {
                        $sql = "UPDATE act2024_bd_game2024_record SET result = :result, great = :great, updated_at = NOW() WHERE udnmember = :udnmember";
                        $stmt = $pdo->prepare($sql);
                        $stmt->bindValue(':udnmember', $udnmember, PDO::PARAM_STR);
                        $stmt->bindValue(':result', $result, PDO::PARAM_STR);
                        $stmt->bindValue(':great', $greatInit, PDO::PARAM_INT);
                        $stmt->execute();
                        JSONReturn([
                            'message' => '您今天已完成占卜',
                            'result' => $result,
                            'great' => $greatInit,
                            'count' => (int)$record['count'],
                        ], true);
                    } catch (PDOException $e) {
                        $logData = initLog("S03-1", $e->getMessage(), getUser());
                        insertFile($logData);
                        JSONReturn('連線異常，請稍後再試');
                    }
                } else {
                    try {
                        $sql = "UPDATE act2024_bd_game2024_record SET udnmember = :udnmember, result = :result, great = :great, updated_at = NOW() WHERE email = :email";
                        $stmt = $pdo->prepare($sql);
                        $stmt->bindValue(':udnmember', $udnmember, PDO::PARAM_STR);
                        $stmt->bindValue(':result', $result, PDO::PARAM_STR);
                        $stmt->bindValue(':great', $greatInit, PDO::PARAM_INT);
                        $stmt->bindValue(':email', getMail(), PDO::PARAM_STR);
                        $stmt->execute();
                        JSONReturn([
                            'message' => '您今天已完成占卜',
                            'result' => $result,
                            'great' => $greatInit,
                            'count' => (int)$record['count'],
                        ], true);
                    } catch (PDOException $e) {
                        $logData = initLog("S03-2", $e->getMessage(), getUser());
                        insertFile($logData);
                        JSONReturn('連線異常，請稍後再試');
                    }
                }
            } else {
                // 新增資料
                try {
                    $sql = "INSERT INTO act2024_bd_game2024_record (udnmember, email, result, great, ip) VALUES (:udnmember, :email, :result, :great, :ip)";
                    $stmt = $pdo->prepare($sql);
                    $stmt->bindValue(':udnmember', $udnmember, PDO::PARAM_STR);
                    $stmt->bindValue(':email', getMail(), PDO::PARAM_STR);
                    $stmt->bindValue(':result', $result, PDO::PARAM_STR);
                    $stmt->bindValue(':great', $greatInit, PDO::PARAM_INT);
                    $stmt->bindValue(':ip', getIP(), PDO::PARAM_STR);
                    $stmt->execute();
                    JSONReturn([
                        'message' => '您今天已完成占卜',
                        'result' => $result,
                        'great' => $greatInit,
                        'count' => 0,
                    ], true);
                } catch (PDOException $e) {
                    $logData = initLog("S04", $e->getMessage(), getUser());
                    insertFile($logData);
                    JSONReturn('新增異常，請稍後再試');
                }
            }
        } else {
            JSONReturn('請重新登入');
        }
    } else {
        JSONReturn('請重新登入');
    }
}
