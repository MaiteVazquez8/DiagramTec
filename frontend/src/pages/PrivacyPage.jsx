/** Política de privacidad (la exige Google para publicar el login con Google). */
import { Link } from 'react-router-dom';

export default function PrivacyPage() {
  return (
    <section className="page-container form-card legal-page">
      <h1>Política de privacidad</h1>
      <p>Última actualización: noviembre de 2026.</p>

      <h2>Qué datos guardamos</h2>
      <ul>
        <li>Nombre, apellido y email de tu cuenta.</li>
        <li>Tu contraseña, solo como hash (nunca en texto plano). Si entrás con Google, guardamos el identificador de tu cuenta de Google y no una contraseña.</li>
        <li>Los diagramas, clases y comentarios que creás.</li>
      </ul>

      <h2>Para qué los usamos</h2>
      <p>Solo para que puedas usar DiagramTec: iniciar sesión, guardar tus diagramas y participar en clases. No vendemos ni compartimos tus datos con fines publicitarios.</p>

      <h2>Inicio de sesión con Google</h2>
      <p>Pedimos únicamente tu nombre, tu email y los datos básicos de tu perfil para crear o vincular tu cuenta. No accedemos a tu correo, tus archivos ni tus contactos.</p>

      <h2>Servicios que usamos</h2>
      <ul>
        <li>Supabase, para la base de datos.</li>
        <li>Cloudflare Turnstile, para frenar bots en el registro y el inicio de sesión.</li>
        <li>Gmail, para enviar los correos de verificación y recuperación de contraseña.</li>
      </ul>

      <h2>Cookies</h2>
      <p>Usamos una única cookie de sesión, necesaria para mantenerte conectado. No usamos cookies de publicidad ni de seguimiento.</p>

      <h2>Tus derechos</h2>
      <p>Podés editar tus datos desde tu perfil y borrar tu cuenta desde <Link to="/account">Mi cuenta</Link>; al borrarla se eliminan tus datos. Para cualquier consulta escribinos a <a href="mailto:diagramtec@gmail.com">diagramtec@gmail.com</a>.</p>
    </section>
  );
}
