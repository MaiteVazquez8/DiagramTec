<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/lib/config.php';

$mysql = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT);

if ($mysql->connect_error) {
    die('Error de conexión: ' . $mysql->connect_error);
}

$mysql->set_charset('utf8mb4');
