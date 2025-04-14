<?php
require_once('config.php');

// 回傳資料 param: $data(array or string), $status(boolean)
function JSONReturn($data, $status = false)
{   
    $dataRes = [];
    if (is_array($data)) {
        $dataRes = $data;
        $dataRes['status'] = $status;
    } elseif (is_string($data)){
        $dataRes = [
            'message' => $data, 
            'status' => $status
        ];
    } else {
        $dataRes = [
            'message' => 'Parameter Error', 
            'status' => $status
        ];
    }
    echo filter_var(json_encode($dataRes));
    die;
}

// google recaptcha 驗證
function checkRecaptchaAuth($token)
{
    $data = [
        'secret' => SECRET,
        'response' => $token,
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://www.google.com/recaptcha/api/siteverify");
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 60);

    $response = json_decode(curl_exec($ch), true);
    curl_close($ch);

    if ($response['success']) {
        return true;
    } else {
        $logData = initLog("G01", "reCAPTCHA 驗證異常", getUser());
        insertFile($logData);
        return false;
    }
}

// 強制使用 HTTPS，確保請求安全性
function isHttps() {
    if (isset($_SERVER['HTTPS']) && ($_SERVER['HTTPS'] === 'on' || $_SERVER['HTTPS'] == 1)) {
        return true;
    }
    if (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443) {
        return true;
    }
    if (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') {
        return true;
    }
    return false;
}

// 確認是否有資料，並增加 post 安全性
function postEmpty($field)
{
    if (empty($field)) {
        return false;
    }
    return htmlspecialchars(stripslashes(trim($field)));
}

// 檢查 email 格式
function checkEmailFormat($email)
{
    if (filter_var($email, FILTER_VALIDATE_EMAIL) || preg_match("/([\w\-]+\@[\w\-]+\.[\w\-]+)/", $email)) {
        return true;
    } else {
        return false;
    }
}

// 取得用戶資料
function getUdnMember($udnmember, $um2)
{
    $data = [
        'account' => $udnmember,
        'um2' => $um2,
        'json' => 'Y',
        'site' => 'bd_game2024'
    ];
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://umapi.udn.com/member/wbs/MemberUm2Check");
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    $response = curl_exec($ch);
    if (curl_errno($ch)) {
        $error = curl_error($ch);
        $arrResponse = json_decode($error, true);
        $logData = initLog("U01", $arrResponse, getUser());
        insertFile($logData);
    } else {
        $arrResponse = json_decode($response, true);
    }
    curl_close($ch);
    return $arrResponse;
}

function getMail()
{
    $udnmember = $_COOKIE["udnmember"];
    $um2 = urlencode($_COOKIE["um2"]);
    $response = getUdnMember($udnmember, $um2);
    $email = filter_var($response["response"]["email"], FILTER_SANITIZE_EMAIL);
    return $email;
}

function getIP()
{
    if (isset($_SERVER['HTTP_AKACIP'])) {
        $ip = $_SERVER['HTTP_AKACIP'];
    } elseif (isset($_SERVER['HTTP_VERCIP'])) {
        $ip = $_SERVER['HTTP_VERCIP'];
    } elseif (isset($_SERVER['HTTP_ECCIP'])) {
        $ip = $_SERVER['HTTP_ECCIP'];
    } elseif (isset($_SERVER['HTTP_L7CIP'])) {
        $ip = $_SERVER['HTTP_L7CIP'];
    } elseif (isset($_SERVER['HTTP_CLIENT_IP'])) {
        $ip = $_SERVER['HTTP_CLIENT_IP'];
    } elseif (isset($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
    } elseif (isset($_SERVER['HTTP_X_FORWARDED'])) {
        $ip = $_SERVER['HTTP_X_FORWARDED'];
    } elseif (isset($_SERVER['HTTP_X_CLUSTER_CLIENT_IP'])) {
        $ip = $_SERVER['HTTP_X_CLUSTER_CLIENT_IP'];
    } elseif (isset($_SERVER['HTTP_FORWARDED_FOR'])) {
        $ip = $_SERVER['HTTP_FORWARDED_FOR'];
    } elseif (isset($_SERVER['HTTP_FORWARDED'])) {
        $ip = $_SERVER['HTTP_FORWARDED'];
    } elseif (isset($_SERVER['REMOTE_ADDR'])) {
        $ip = $_SERVER['REMOTE_ADDR'];
    } else {
        $ip = 'UNKNOWN';
    }
    
    if (filter_var($ip, FILTER_VALIDATE_IP)) {
        return $ip;
    } else {
        return null;
    }
}

function getUser()
{
    if (isset($_COOKIE["udnmember"])) {
        $user = $_COOKIE["udnmember"];
    } else {
        $user = getIP();
    }
    return $user;
}

// 檢查 email 是否已是 udn 會員
function checkEmail($email)
{
    $data = array(
        'email' => "$email",
        'json' => 'Y',
    );
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://umapi.udn.com/member/wbs/MemberChkEmail");
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    $response = curl_exec($ch);
    if (curl_errno($ch)) {
        $error = curl_error($ch);
        $arrResponse = json_decode($error, true);
        $logData = initLog("U02", $arrResponse, getUser());
        insertFile($logData);
    } else {
        $arrResponse = json_decode($response, true);
    }
    curl_close($ch);
    return $arrResponse['status'];
}

// 隨機取值
function swap(&$a, &$b)
{
    list($a, $b) = array($b, $a);
} 

function getSecureRandomRangedValue($max = 99, $min = 0)
{
    $sortarray = array();
    $lo = (int)$min;
    $hi = (int)$max;
    if ($lo > $hi) swap($lo, $hi);
    $data_range = abs($hi - $lo) + 1;
    $bytes_per_key = 4;
    $num_bytes = $data_range * $bytes_per_key;
    $byte_string = (bin2hex(openssl_random_pseudo_bytes($num_bytes)));
    $byte_blocksize = $bytes_per_key << 1;
    while ($key = substr($byte_string, 0, $byte_blocksize)) {
        $byte_string = substr($byte_string, $byte_blocksize);
        $sortarray[] = $key;
    }
    $sortarray = array_flip($sortarray);
    ksort($sortarray);
    return array_shift($sortarray) + $lo;  
}

// Log 資料格式
function initLog($code, $msg, $user = null)
{
    $url = 'http://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
    $data = [
        'project' => '【bd_game2024】' . "\r\n",
        'url' => $url . "\r\n",
        'user' => $user . "\r\n",
        'code' => $code . "\r\n",
        'msg' => $msg . "\r\n",
        'ip' => getIP() . "\r\n",
        'date' => date("Y-m-d H:i:s") . "\r\n",
    ];
    return $data;
}

// Log 資料寫入檔案
function insertFile($data)
{
    $log_filename = "event_log";
    if (!file_exists($log_filename)) {
        mkdir($log_filename, 0777, true);
    }
    $file = $log_filename . "/errLog.log";
    if ($data) {
        file_put_contents($file, $data, FILE_APPEND);
    }
}