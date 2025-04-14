<?php
date_default_timezone_set("Asia/Taipei");
header('Content-Type: application/json charset=utf-8');

// Recaptcha 金鑰
define('SECRET', '6LcA97YUAAAAAPd2wi7_JJaUE-T4xZCvnZW9xumZ');

// 活動期間
define('EVENT_START', date('Y-m-d H:i:s', strtotime('2024-11-07 10:00:00')));
define('EVENT_END', date('Y-m-d H:i:s', strtotime('2024-12-04 10:00:00')));
define('EVENT_WINNER', date('Y-m-d H:i:s', strtotime('2024-12-11 10:00:00')));
