<?php

function loadEnvFile($path)
{
    if (!is_readable($path)) {
        return;
    }
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }
        if (!str_contains($line, '=')) {
            continue;
        }
        [$key, $value] = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value, " \t\"'");
        if ($key !== '' && getenv($key) === false) {
            putenv("$key=$value");
            $_ENV[$key] = $value;
        }
    }
}

loadEnvFile(__DIR__ . '/../.env');
loadEnvFile(__DIR__ . '/../../backend/.env');

define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASSWORD', getenv('DB_PASSWORD') ?: '');
define('DB_NAME', getenv('DB_NAME') ?: 'tecdiagram');
define('DB_PORT', (int) (getenv('DB_PORT') ?: 3306));
define('JWT_SECRET', getenv('JWT_SECRET') ?: 'nuevaContraseña_superSegura_diagramtec');
