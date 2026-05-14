<?php
require 'vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

$JWT_SECRET = "nuevaContraseña_superSegura_diagramtec";

function generarJWT($user) {

    global $JWT_SECRET;

    $payload = [
        "id" => $user['id'],
        "role" => $user['role'],
        "exp" => time() + (60 * 60 * 24 * 2)
    ];

    return JWT::encode($payload, $JWT_SECRET, 'HS256');
}
?>