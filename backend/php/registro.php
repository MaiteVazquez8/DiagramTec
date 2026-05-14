<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

include('conexion.php');

$message = "";

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

                $message = "Usuario creado correctamente";

            } else {

                $message = "Error al crear usuario";

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