import { Link } from 'react-router-dom';
import Spinner from './Spinner.jsx';

const VARIANTS = {
  primary: 'primary-button',
  secondary: 'secondary-button',
  danger: 'danger-button',
  ghost: 'ghost-link',
};

/**
 * Botón reutilizable. variant: primary | secondary | danger | ghost
 * Si `to` está definido, renderiza Link de react-router.
 */
export default function Button({
  variant = 'primary',
  fullWidth = false,
  loading = false,
  disabled = false,
  type = 'button',
  to,
  className = '',
  children,
  ...rest
}) {
  const classes = [
    VARIANTS[variant] || VARIANTS.primary,
    fullWidth ? 'full-width' : '',
    loading ? 'ui-btn--loading' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {loading ? <Spinner size={variant === 'ghost' ? 16 : 18} className="ui-spinner--inline" /> : null}
      <span className="ui-btn__label">{children}</span>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} disabled={disabled || loading} {...rest}>
      {content}
    </button>
  );
}
