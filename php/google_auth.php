<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/lib/cors.php';
require_once __DIR__ . '/lib/config.php';
require_once __DIR__ . '/conexion.php';
require_once __DIR__ . '/jwt.php';

// Cargar variables de entorno de PHP/.env
$envPath = __DIR__ . '/.env';
if (is_readable($envPath)) {
    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
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
        if ($key !== '') {
            putenv("$key=$value");
            $_ENV[$key] = $value;
        }
    }
}

$action = $_GET['action'] ?? '';

if ($action === 'login') {
    handleGoogleLogin();
} elseif ($action === 'callback') {
    handleGoogleCallback();
} else {
    http_response_code(400);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Action not specified'], JSON_UNESCAPED_UNICODE);
    exit;
}

function handleGoogleLogin()
{
    $clientId = getenv('GOOGLE_CLIENT_ID');
    $redirectUri = getenv('GOOGLE_CALLBACK_URL');
    
    if (!$clientId || !$redirectUri) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => 'Google credentials not configured'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $state = bin2hex(random_bytes(16));
    $_SESSION['google_oauth_state'] = $state;

    $authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query([
        'client_id' => $clientId,
        'redirect_uri' => $redirectUri,
        'response_type' => 'code',
        'scope' => 'openid profile email',
        'state' => $state,
        'access_type' => 'online',
    ]);

    header("Location: $authUrl");
    exit;
}

function handleGoogleCallback()
{
    global $mysql;

    $code = $_GET['code'] ?? null;
    $state = $_GET['state'] ?? null;

    if (!$code || !$state) {
        http_response_code(400);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => 'Missing code or state'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Validar estado
    if (!isset($_SESSION['google_oauth_state']) || $_SESSION['google_oauth_state'] !== $state) {
        http_response_code(403);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => 'Invalid state parameter'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    unset($_SESSION['google_oauth_state']);

    $clientId = getenv('GOOGLE_CLIENT_ID');
    $clientSecret = getenv('GOOGLE_CLIENT_SECRET');
    $redirectUri = getenv('GOOGLE_CALLBACK_URL');

    // Intercambiar código por token
    $tokenUrl = 'https://oauth2.googleapis.com/token';
    $tokenRequest = [
        'client_id' => $clientId,
        'client_secret' => $clientSecret,
        'code' => $code,
        'grant_type' => 'authorization_code',
        'redirect_uri' => $redirectUri,
    ];

    $ch = curl_init($tokenUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($tokenRequest));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);

    $tokenResponse = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        http_response_code(401);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => 'Failed to exchange code for token'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $tokenData = json_decode($tokenResponse, true);
    $accessToken = $tokenData['access_token'] ?? null;

    if (!$accessToken) {
        http_response_code(401);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => 'No access token received'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Obtener información del usuario
    $userInfoUrl = 'https://www.googleapis.com/oauth2/v1/userinfo';
    $ch = curl_init($userInfoUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Bearer $accessToken"]);

    $userInfoResponse = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        http_response_code(401);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => 'Failed to fetch user info'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $userInfo = json_decode($userInfoResponse, true);
    $googleId = $userInfo['id'] ?? null;
    $email = strtolower($userInfo['email'] ?? '');
    $firstName = $userInfo['given_name'] ?? 'Google';
    $lastName = $userInfo['family_name'] ?? 'User';

    if (!$googleId || !$email) {
        http_response_code(400);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => 'Incomplete user info from Google'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Buscar usuario existente
    $stmt = $mysql->prepare('SELECT id, firstName, lastName, email, role FROM users WHERE email = ? OR googleId = ?');
    $stmt->bind_param('ss', $email, $googleId);
    $stmt->execute();
    $existingUser = $stmt->get_result()->fetch_assoc();

    if ($existingUser) {
        $user = $existingUser;

        // Si existe pero no tiene googleId, actualizar
        if (empty($existingUser['googleId'])) {
            $updateStmt = $mysql->prepare('UPDATE users SET googleId = ? WHERE id = ?');
            $updateStmt->bind_param('si', $googleId, $existingUser['id']);
            $updateStmt->execute();
            $updateStmt->close();
        }
    } else {
        // Crear nuevo usuario
        $role = 'student';
        $stmt = $mysql->prepare('INSERT INTO users (firstName, lastName, email, googleId, role) VALUES (?, ?, ?, ?, ?)');
        $stmt->bind_param('sssss', $firstName, $lastName, $email, $googleId, $role);

        if (!$stmt->execute()) {
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['error' => 'Error creating user'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $userId = $stmt->insert_id;
        $user = [
            'id' => $userId,
            'firstName' => $firstName,
            'lastName' => $lastName,
            'email' => $email,
            'role' => $role,
        ];

        $stmt->close();
    }

    // Generar JWT token
    $token = generarJWT($user);

    // Redirigir al frontend con el token
    $frontendUrl = getenv('FRONTEND_URL') ?: 'http://localhost:5173';
    $redirectUrl = rtrim($frontendUrl, '/') . '/login?token=' . urlencode($token);
    header("Location: $redirectUrl");
    exit;
}