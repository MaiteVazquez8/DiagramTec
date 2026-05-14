<?php

include('conexion.php');
include('mail.php');

$message = "";

if (isset($_POST['enviarToken'])) {

    $email = trim($_POST['email']);

    if (empty($email)) {

        $message = "Ingrese un correo";

    } else {

        $stmt = $mysql->prepare("
            SELECT *
            FROM users
            WHERE email=?
        ");

        if (!$stmt) {
            die("Error SQL: " . $mysql->error);
        }

        $stmt->bind_param("s", $email);

        $stmt->execute();

        $resultado = $stmt->get_result();

        $user = $resultado->fetch_assoc();

        if ($user) {

            // NUEVO TOKEN
            $token = random_int(100000, 999999);

            $update = $mysql->prepare("
                UPDATE users
                SET token=?
                WHERE id=?
            ");

            if (!$update) {
                die("Error SQL UPDATE: " . $mysql->error);
            }

            $update->bind_param(
                "si",
                $token,
                $user['id']
            );

            if ($update->execute()) {

                // ENVIAR MAIL
                $mailEnviado = enviarMail(
                    $user['email'],
                    "Recuperación de contraseña",
                    "
                    <h2>Recuperación de contraseña</h2>

                    <p>Solicitaste cambiar tu contraseña.</p>

                    <p>Tu código de recuperación es:</p>

                    <h1>$token</h1>

                    <p>Este código es de un solo uso.</p>
                    "
                );

                if ($mailEnviado) {

                    $message = "Se envió un código al correo";

                } else {

                    $message = "No se pudo enviar el correo";

                }

            } else {

                $message = "Error al generar token";

            }

            $update->close();

        } else {

            $message = "Usuario no encontrado";

        }

        $stmt->close();
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

    <title>Recuperar contraseña</title>

</head>

<body>

    <form action="" method="POST">

        <h1>Recuperar contraseña</h1>

        <input
            type="email"
            name="email"
            placeholder="Correo electrónico"
            required
        >

        <br><br>

        <button
            type="submit"
            name="enviarToken"
        >
            Enviar código
        </button>

        <br><br>

        <a href="login.php">
            Volver al login
        </a>

        <br><br>

        <p>
            <?php echo $message; ?>
        </p>

    </form>

</body>

</html>