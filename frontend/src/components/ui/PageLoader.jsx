import Spinner from './Spinner.jsx';

/** Loader centrado para pantallas completas o secciones. */
export default function PageLoader({ label = 'Cargando...', className = '' }) {
  return (
    <div className={`ui-page-loader ui-fade-in ${className}`.trim()} role="status" aria-live="polite">
      <Spinner size={32} />
      <p>{label}</p>
    </div>
  );
}
