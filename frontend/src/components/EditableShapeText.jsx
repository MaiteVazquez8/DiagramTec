import { useEffect, useRef } from 'react';

/**
 * Texto editable dentro de una forma del diagrama.
 * Sincroniza el título con el estado y dispara autoajuste de tamaño al escribir.
 */
export default function EditableShapeText({
  text = '',
  style,
  className = '',
  editable = true,
  onTextChange,
  onTextCommit,
}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || document.activeElement === el) return;
    const next = text ?? '';
    if (el.innerText !== next) {
      el.textContent = next;
    }
  }, [text]);

  const emitChange = () => {
    const el = ref.current;
    if (!el || !onTextChange) return;
    onTextChange(el.innerText.replace(/\u00a0/g, ' '), el);
  };

  return (
    <div
      ref={ref}
      className={`editable-text ${className}`.trim()}
      style={style}
      contentEditable={editable}
      suppressContentEditableWarning
      onInput={emitChange}
      onBlur={() => {
        emitChange();
        onTextCommit?.();
      }}
      onPointerDown={(event) => event.stopPropagation()}
      onPointerUp={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    />
  );
}
