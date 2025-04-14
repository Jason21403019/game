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
session_start();
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(openssl_random_pseudo_bytes(32));
}
$csrfToken = $_SESSION['csrf_token'];

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    // 檢查是否在活動期間
    $today = date('Y-m-d H:i:s');
    if ($today < EVENT_START) {
        JSONReturn('活動尚未開始');
    } elseif ($today >= EVENT_END && $today < EVENT_WINNER) {
        JSONReturn('活動已結束，尚未公布中獎名單');
    } elseif ($today >= EVENT_WINNER) {
        JSONReturn('活動已結束，中獎名單已公布');
    } else {
        JSONReturn($csrfToken, true);
    }
}
