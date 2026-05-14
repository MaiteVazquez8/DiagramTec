<?php

session_start();

include('conexion.php');
include('jwt.php');
include('mail.php');

$message = "";

if (isset($_POST['login'])) {

    $email = trim($_POST['email']);
    $userPassword = $_POST['password'];

    $stmt = $mysql->prepare("
        SELECT * FROM users
        WHERE email=?
    ");

    if (!$stmt) {
        die("Error SQL: " . $mysql->error);
    }

    $stmt->bind_param("s", $email);

    $stmt->execute();

    $resultado = $stmt->get_result();

    $user = $resultado->fetch_assoc();

    if ($user && password_verify($userPassword, $user['passwordHash'])) {

        $jwt = generarJWT($user);

        $_SESSION['jwt'] = $jwt;

        $_SESSION['user_id'] = $user['id'];

        $_SESSION['role'] = $user['role'];

        enviarMail(
            $user['email'],
            "Nuevo inicio de sesión",
            "
            <h2>Inicio de sesión detectado</h2>
            <p>Tu cuenta inició sesión correctamente.</p>
            "
        );

        header("Location: dashboard.php");

        exit();

    } else {

        $message = "Credenciales inválidas";

    }
}
?>

<!DOCTYPE html>
<html lang="es">
<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>Iniciar sesión</title>

</head>

<body>

    <form action="" method="POST">

        <h1>Iniciar sesión</h1>

        <input
            type="email"
            name="email"
            placeholder="Correo electrónico"
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

        <button type="submit" name="login">
            Iniciar sesión
        </button>

        <br><br>

        <a href="registro.php">
            Crear cuenta
        </a>

        <br>

        <a href="recuperarClave.php">
            Recuperar contraseña
        </a>

        <br><br>

        <p>
            <?php echo $message; ?>
        </p>

    </form>

</body>
</html>