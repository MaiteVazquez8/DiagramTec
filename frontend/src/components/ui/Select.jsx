/** Selector con etiqueta (estilo figma-field). */
export default function Select({
  label,
  id,
  error,
  className = '',
  children,
  ...selectProps
}) {
  const fieldId = id || selectProps.name;

  return (
    <label className={`figma-field ui-field${error ? ' ui-field--error' : ''} ${className}`.trim()} htmlFor={fieldId}>
      {label ? <span className="figma-field__label">{label}</span> : null}
      <select id={fieldId} className="ui-select" {...selectProps}>
        {children}
      </select>
      {error ? <span className="ui-field__error">{error}</span> : null}
    </label>
  );
}
