/** Listado Figma: cabecera de columnas + filas en tarjetas. */
import SuperAdminUserManageRow from './SuperAdminUserManageRow.jsx';

/**
 * Tabla/lista de gestión de usuarios en el panel superadmin.
 * Muestra estados de carga, vacío o filas editables.
 */
export default function SuperAdminUserManageList({
  loading,
  loadingText,
  emptyMessage,
  users,
  lockRole,
  savingId,
  onSave,
  onDelete,
  deleteLabel,
}) {
  if (loading) {
    return <p className="superadmin-manage__loading">{loadingText}</p>;
  }

  if (users.length === 0) {
    return <p className="superadmin-manage__empty">{emptyMessage}</p>;
  }

  return (
    <>
      {/* Fila de encabezados de columnas (no editable) */}
      <div className="superadmin-manage__row superadmin-manage__row--head" role="row">
        <span className="superadmin-manage__col-head superadmin-manage__col-head--avatar" aria-hidden />
        <span className="superadmin-manage__col-head">Email</span>
        <span className="superadmin-manage__col-head">Nombre</span>
        <span className="superadmin-manage__col-head">Apellido</span>
        <span className="superadmin-manage__col-head">Rol</span>
        <span className="superadmin-manage__col-head superadmin-manage__col-head--modify">Modificar</span>
        <span className="superadmin-manage__col-head superadmin-manage__col-head--delete">Eliminar</span>
      </div>

      {/* Una fila editable por cada usuario */}
      <div className="superadmin-manage__list">
        {users.map((user) => (
          <SuperAdminUserManageRow
            key={user.id}
            user={user}
            lockRole={lockRole}
            saving={savingId === user.id}
            onSave={onSave}
            onDelete={onDelete}
            deleteLabel={deleteLabel}
          />
        ))}
      </div>
    </>
  );
}
