<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

$host = "localhost";
$user = "root";
$db_password = "";
$database = "diagramtec";
$port = 3307;

$mysql = new mysqli(
    $host,
    $user,
    $db_password,
    $database,
    $port
);

if ($mysql->connect_error) {
    die("Error de conexión: " . $mysql->connect_error);
}

$mysql->set_charset("utf8");
?>