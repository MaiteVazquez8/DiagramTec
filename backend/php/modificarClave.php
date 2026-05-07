<?php

include('conexion.php');

$message = "";

if (isset($_POST['cambiar'])) {

    $email = trim($_POST['email']);

    $token = trim($_POST['token']);

    $userPassword = $_POST['password'];

    $userPassword2 = $_POST['password2'];

    if (
        empty($email) ||
        empty($token) ||
        empty($userPassword) ||
        empty($userPassword2)
    ) {

        $message = "Complete todos los campos";

    } elseif ($userPassword !== $userPassword2) {

        $message = "Las contraseñas no coinciden";

    } else {

        $stmt = $mysql->prepare("
            SELECT *
            FROM users
            WHERE email=? AND token=?
        ");

        if (!$stmt) {
            die("Error SQL: " . $mysql->error);
        }

        $stmt->bind_param("ss", $email, $token);

        $stmt->execute();

        $resultado = $stmt->get_result();

        $user = $resultado->fetch_assoc();

        if ($user) {

            $hash = password_hash(
                $userPassword,
                PASSWORD_BCRYPT
            );
            
            $nuevoToken = rand(100000, 999999);

            $update = $mysql->prepare("
                UPDATE users
                SET passwordHash=?, token=?
                WHERE id=?
            ");

            if (!$update) {
                die("Error SQL UPDATE: " . $mysql->error);
            }

            $update->bind_param(
                "ssi",
                $hash,
                $nuevoToken,
                $user['id']
            );

            if ($update->execute()) {

                $message = "Contraseña actualizada correctamente";

            } else {

                $message = "Error al actualizar contraseña";

            }

        } else {

            $message = "Correo o token inválido";

        }
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

    <title>Cambiar contraseña</title>

</head>

<body>

    <form action="" method="POST">

        <h1>Cambiar contraseña</h1>

        <input
            type="email"
            name="email"
            placeholder="Correo electrónico"
            required
        >

        <br><br>

        <input
            type="text"
            name="token"
            placeholder="Token"
            required
        >

        <br><br>

        <input
            type="password"
            name="password"
            placeholder="Nueva contraseña"
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

        <button
            type="submit"
            name="cambiar"
        >
            Cambiar contraseña
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