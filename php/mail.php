<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once __DIR__ . '/lib/config.php';
require 'vendor/autoload.php';

function enviarMail($destino, $asunto, $mensaje) {
    $user = getenv('EMAIL_USER') ?: '';
    $pass = getenv('EMAIL_PASS') ?: '';

    if ($user === '' || $pass === '') {
        error_log('[mail] EMAIL_USER / EMAIL_PASS no configurados');
        return false;
    }

    $mail = new PHPMailer(true);
    $mail->CharSet = 'UTF-8';
    $mail->Encoding = 'base64';

    try {
        $mail->isSMTP();
        $mail->Host = getenv('EMAIL_HOST') ?: 'smtp.gmail.com';
        $mail->SMTPAuth = true;
        $mail->Username = $user;
        $mail->Password = $pass;
        $mail->SMTPSecure = (getenv('EMAIL_SECURE') === 'true') ? PHPMailer::ENCRYPTION_SMTPS : PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = (int) (getenv('EMAIL_PORT') ?: 587);
        $mail->setFrom($user, 'DiagramTec');
        $mail->addAddress($destino);
        $mail->isHTML(true);
        $mail->Subject = $asunto;
        $mail->Body = $mensaje;
        $mail->send();

        return true;
    } catch (Exception $e) {
        error_log('[mail] Error al enviar: ' . $mail->ErrorInfo);
        return false;
    }
}
