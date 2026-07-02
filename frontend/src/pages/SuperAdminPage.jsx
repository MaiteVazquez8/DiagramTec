/** Panel superadmin — dashboard (alumnos, profesores, clases). */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import SuperAdminShell from '../components/superadmin/SuperAdminShell.jsx';
import {
  SuperAdminSection,
  SuperAdminPersonTile,
  SuperAdminClassTile,
  previewItems,
} from '../components/superadmin/SuperAdminTiles';
import { SuperAdminDashboardSkeleton } from '../components/skeletons/PageSkeletons.jsx';

export default function SuperAdminPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, classesRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/classes'),
      ]);
      setUsers(usersRes.data.users || []);
      setClasses(classesRes.data.classes || []);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SuperAdminShell>
        <SuperAdminDashboardSkeleton />
      </SuperAdminShell>
    );
  }

  const students = users.filter((u) => u.role === 'student');
  const teachers = users.filter((u) => u.role === 'teacher');

  const goStudents = (e) => {
    e.preventDefault();
    navigate('/superadmin/alumnos');
  };

  const goTeachers = (e) => {
    e.preventDefault();
    navigate('/superadmin/profesores');
  };

  const goClasses = (e) => {
    e.preventDefault();
    navigate('/superadmin/clases');
  };

  return (
    <SuperAdminShell>
      <main className="superadmin-dashboard__main" id="superadmin-page">
        <SuperAdminSection
          id="alumnos"
          title="Alumnos"
          verTodoHref="/superadmin/alumnos"
          onVerTodo={goStudents}
          isEmpty={students.length === 0}
          emptyMessage="No hay alumnos registrados."
        >
          {previewItems(students).map((u) => (
            <SuperAdminPersonTile
              key={u.id}
              user={u}
              onClick={() => navigate('/superadmin/alumnos')}
            />
          ))}
        </SuperAdminSection>

        <SuperAdminSection
          id="profesores"
          title="Profesores"
          verTodoHref="/superadmin/profesores"
          onVerTodo={goTeachers}
          isEmpty={teachers.length === 0}
          emptyMessage="No hay profesores registrados."
        >
          {previewItems(teachers).map((u) => (
            <SuperAdminPersonTile
              key={u.id}
              user={u}
              onClick={() => navigate('/superadmin/profesores')}
            />
          ))}
        </SuperAdminSection>

        <SuperAdminSection
          id="clases"
          title="Clases"
          verTodoHref="/superadmin/clases"
          onVerTodo={goClasses}
          isEmpty={classes.length === 0}
          emptyMessage="No hay clases creadas."
        >
          {previewItems(classes).map((c) => (
            <SuperAdminClassTile
              key={c.id}
              classItem={c}
              onClick={() => navigate(`/classes/${c.id}`)}
            />
          ))}
        </SuperAdminSection>
      </main>
    </SuperAdminShell>
  );
}
