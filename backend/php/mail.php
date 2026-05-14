<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'vendor/autoload.php';

function enviarMail($destino, $asunto, $mensaje) {

    $mail = new PHPMailer(true);

    try {

        $mail->isSMTP();

        $mail->Host = 'smtp.gmail.com';

        $mail->SMTPAuth = true;

        $mail->Username = 'diagramtec@gmail.com';

        $mail->Password = 'poxtavbmlepblanm';

        $mail->SMTPSecure = 'tls';

        $mail->Port = 587;

        $mail->setFrom('diagramtec@gmail.com', 'DiagramTec');

        $mail->addAddress($destino);

        $mail->isHTML(true);

        $mail->Subject = $asunto;

        $mail->Body = $mensaje;

        $mail->send();

        return true;

    } catch (Exception $e) {

        return false;

    }
}
?>