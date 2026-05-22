<?php

require_once __DIR__ . '/lib/config.php';

$autoload = __DIR__ . '/vendor/autoload.php';
if (!is_readable($autoload)) {
    if (php_sapi_name() !== 'cli') {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code(500);
        echo json_encode(['error' => 'Falta vendor/. Ejecuta composer install en la carpeta php/']);
    }
    exit(1);
}
require $autoload;

use Firebase\JWT\JWT;

function generarJWT(array $user): string
{
    $payload = [
        'id' => (int) $user['id'],
        'role' => $user['role'],
        'exp' => time() + (60 * 60 * 48),
    ];
    return JWT::encode($payload, JWT_SECRET, 'HS256');
}
