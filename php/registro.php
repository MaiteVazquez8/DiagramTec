<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

include('conexion.php');

if (
    ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST'
    && str_contains(strtolower($_SERVER['CONTENT_TYPE'] ?? ''), 'application/json')
) {
    header('Content-Type: application/json; charset=utf-8');
    include __DIR__ . '/conexion.php';
    include __DIR__ . '/jwt.php';

    $body = json_decode(file_get_contents('php://input'), true) ?: [];
    $firstName = trim($body['firstName'] ?? '');
    $lastName = trim($body['lastName'] ?? '');
    $email = strtolower(trim($body['email'] ?? ''));
    $password = $body['password'] ?? '';
    $role = in_array($body['role'] ?? '', ['student', 'teacher'], true) ? $body['role'] : 'student';

    if ($firstName === '' || $lastName === '' || $email === '' || $password === '') {
        http_response_code(400);
        echo json_encode(['error' => 'Faltan datos obligatorios'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Ingresa un correo válido'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $domain = substr(strrchr($email, '@'), 1);
    if ($domain === false || (!checkdnsrr($domain, 'MX') && !checkdnsrr($domain, 'A'))) {
        http_response_code(400);
        echo json_encode(['error' => 'Ingresa un correo con un dominio válido'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $stmt = $mysql->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->bind_param('s', $email);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        http_response_code(400);
        echo json_encode(['error' => 'El correo ya está registrado'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $hash = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $mysql->prepare(
        'INSERT INTO users (firstName, lastName, email, passwordHash, role) VALUES (?, ?, ?, ?, ?)'
    );
    $stmt->bind_param('sssss', $firstName, $lastName, $email, $hash, $role);
    if (!$stmt->execute()) {
        http_response_code(500);
        echo json_encode(['error' => 'Error al crear usuario'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $id = (int) $stmt->insert_id;
    $user = [
        'id' => $id,
        'firstName' => $firstName,
        'lastName' => $lastName,
        'email' => $email,
        'role' => $role,
    ];

    include __DIR__ . '/mail.php';
    $mailEnviado = enviarMail(
        $user['email'],
        'Confirmación de registro',
        "<h2>Bienvenido a DiagramTec</h2><p>Gracias por registrarte con este correo.</p>"
    );

    if (!$mailEnviado) {
        $delete = $mysql->prepare('DELETE FROM users WHERE id = ?');
        $delete->bind_param('i', $id);
        $delete->execute();
        http_response_code(400);
        echo json_encode(['error' => 'No se pudo enviar el correo. Usa un correo real.'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    echo json_encode([
        'token' => generarJWT($user),
        'user' => $user,
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

include __DIR__ . '/conexion.php';
include __DIR__ . '/mail.php';

$message = '';

if (isset($_POST['CrearUsuario'])) {

    $firstName = trim($_POST['firstName']);
    $lastName = trim($_POST['lastName']);
    $email = trim($_POST['email']);
    $password = $_POST['password'];
    $password2 = $_POST['password2'];

    if (
        empty($firstName) ||
        empty($lastName) ||
        empty($email) ||
        empty($password) ||
        empty($password2)
    ) {

        $message = "Todos los campos son obligatorios";

    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {

        $message = "Ingrese un correo válido";

    } else {
        $domain = substr(strrchr($email, '@'), 1);
        if ($domain === false || (!checkdnsrr($domain, 'MX') && !checkdnsrr($domain, 'A'))) {
            $message = "Ingrese un correo con un dominio válido";
        } elseif ($password !== $password2) {
            $message = "Las contraseñas no coinciden";
        } else {

        $stmt = $mysql->prepare("
            SELECT id
            FROM users
            WHERE email=?
        ");

        $stmt->bind_param("s", $email);

        $stmt->execute();

        $resultado = $stmt->get_result();

        if ($resultado->num_rows > 0) {

            $message = "El correo ya existe";

        } else {

            $hash = password_hash($password, PASSWORD_BCRYPT);

            $role = "student";

            // TOKEN DE RECUPERACIÓN
            $token = rand(100000, 999999);

            $stmt = $mysql->prepare("
                INSERT INTO users
                (firstName,lastName,email,passwordHash,role,token)
                VALUES (?,?,?,?,?,?)
            ");

            $stmt->bind_param(
                "ssssss",
                $firstName,
                $lastName,
                $email,
                $hash,
                $role,
                $token
            );

            if ($stmt->execute()) {
                $insertId = $stmt->insert_id;

                $mailEnviado = enviarMail(
                    $email,
                    'Confirmación de registro',
                    "<h2>Bienvenido a DiagramTec</h2><p>Gracias por registrarte con este correo.</p>"
                );

                if ($mailEnviado) {
                    $message = "Usuario creado correctamente";
                } else {
                    $delete = $mysql->prepare('DELETE FROM users WHERE id = ?');
                    $delete->bind_param('i', $insertId);
                    $delete->execute();
                    $message = "No se pudo enviar el correo. Usa un correo real.";
                }

            } else {

                $message = "Error al crear usuario";

            }
        }
    }
}
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registro</title>
</head>
<body>

<form method="POST">

    <h1>Crear cuenta</h1>

    <input
        type="text"
        name="firstName"
        placeholder="Nombre"
        required
    >

    <br><br>

    <input
        type="text"
        name="lastName"
        placeholder="Apellido"
        required
    >

    <br><br>

    <input
        type="email"
        name="email"
        placeholder="Correo"
        required
    >

    <br><br>

    <input
        type="password"
        name="password"
        placeholder="Contraseña"
        required
    >

    <br><br>

    <input
        type="password"
        name="password2"
        placeholder="Confirmar contraseña"
        required
    >

    <br><br>

    <button type="submit" name="CrearUsuario">
        Registrarse
    </button>

    <br><br>

    <?php echo $message; ?>

</form>

</body>
</html>
