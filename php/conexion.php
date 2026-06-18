<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/lib/config.php';
require_once __DIR__ . '/lib/pdo_shim.php';

$databaseUrl = getenv('DATABASE_URL');
if (!$databaseUrl) {
    die('Error de conexión: DATABASE_URL no configurada. Añádela en backend/.env (Supabase → Settings → Database).');
}

try {
    $mysql = PgConnection::fromDatabaseUrl($databaseUrl);
} catch (Throwable $e) {
    die('Error de conexión: ' . $e->getMessage());
}
