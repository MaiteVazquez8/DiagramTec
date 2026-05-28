/** Listado Figma: cabecera de columnas + filas en tarjetas. */
import SuperAdminUserManageRow from './SuperAdminUserManageRow.jsx';

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
      <div className="superadmin-manage__row superadmin-manage__row--head" role="row">
        <span className="superadmin-manage__col-head superadmin-manage__col-head--avatar" aria-hidden />
        <span className="superadmin-manage__col-head">Email</span>
        <span className="superadmin-manage__col-head">Nombre</span>
        <span className="superadmin-manage__col-head">Apellido</span>
        <span className="superadmin-manage__col-head">Rol</span>
        <span className="superadmin-manage__col-head superadmin-manage__col-head--modify">Modificar</span>
        <span className="superadmin-manage__col-head superadmin-manage__col-head--delete">Eliminar</span>
      </div>

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
