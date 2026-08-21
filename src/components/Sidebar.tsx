import { NavLink } from 'react-router-dom';

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h3>BigData Admin</h3>
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/dashboard/procesar" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          Procesar
        </NavLink>
        <NavLink to="/dashboard/limpiar" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          Limpiar datos
        </NavLink>
        <NavLink to="/dashboard/reportes" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          Reportes
        </NavLink>
      </nav>
      <div className="sidebar-footer">
        <NavLink to="/" className="sidebar-link back-link">
          ← Volver al sitio
        </NavLink>
      </div>
    </aside>
  );
}

export default Sidebar;