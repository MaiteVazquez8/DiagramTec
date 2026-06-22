/** Área de texto con etiqueta (estilo figma-field). */
export default function Textarea({
  label,
  id,
  error,
  className = '',
  rows = 4,
  ...textareaProps
}) {
  const fieldId = id || textareaProps.name;

  return (
    <label className={`figma-field ui-field${error ? ' ui-field--error' : ''} ${className}`.trim()} htmlFor={fieldId}>
      {label ? <span className="figma-field__label">{label}</span> : null}
      <textarea id={fieldId} className="ui-textarea" rows={rows} {...textareaProps} />
      {error ? <span className="ui-field__error">{error}</span> : null}
    </label>
  );
}
