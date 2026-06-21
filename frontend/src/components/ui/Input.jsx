/**
 * Campo de texto con etiqueta (estilo figma-field).
 * Compatible con formularios auth y modales.
 */
export default function Input({
  label,
  id,
  error,
  className = '',
  labelClassName = 'figma-field',
  ...inputProps
}) {
  const fieldId = id || inputProps.name;

  return (
    <label className={`${labelClassName} ui-field${error ? ' ui-field--error' : ''} ${className}`.trim()} htmlFor={fieldId}>
      {label ? <span className="figma-field__label">{label}</span> : null}
      <input id={fieldId} className="ui-input" {...inputProps} />
      {error ? <span className="ui-field__error">{error}</span> : null}
    </label>
  );
}
