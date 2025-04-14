<?php
    $host = '192.168.15.50';
    $user = 'member';
    $pass = 'member123';
    $dbname = 'event';

    $dsn = "mysql:host=$host;dbname=$dbname;charset=utf8";
    $options = array(PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION);
    $pdo = new PDO($dsn, $user, $pass, $options);
?>