/** Panel superadmin — dashboard (alumnos, profesores, clases). */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { fetchAdminDashboardData, describeAdminLoadError } from '../utils/adminUsers.js';
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
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const {
        students: studentsList,
        teachers: teachersList,
        classes: classesList,
        loadError: partialError,
      } = await fetchAdminDashboardData(api);
      setStudents(studentsList);
      setTeachers(teachersList);
      setClasses(classesList);
      if (partialError) setLoadError(partialError);
    } catch (err) {
      console.error('Error fetching admin data:', err);
      setLoadError(describeAdminLoadError(err));
      setStudents([]);
      setTeachers([]);
      setClasses([]);
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
        {loadError && (
          <div className="superadmin-row__empty superadmin-row__empty--error" role="alert">
            <p>{loadError}</p>
            <button type="button" className="secondary-button" onClick={fetchData}>
              Reintentar
            </button>
          </div>
        )}
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
