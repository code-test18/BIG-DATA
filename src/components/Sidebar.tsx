import { NavLink } from 'react-router-dom';

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h3>BigData Admin</h3>
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/dashboard/Inicio" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          Inicio
        </NavLink>
        <NavLink to="/dashboard/limpiardatos" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          Carga y Limpieza
        </NavLink>
        <NavLink to="/dashboard/procesar" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          Procesar
        </NavLink>
        <NavLink to="/dashboard/ventas" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          Ventas
        </NavLink>
        <NavLink to="/dashboard/reportes" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          Reportes
        </NavLink>
        <NavLink to="/dashboard/Inteligencia" className="sidebar-link">
          Negocio/Inteligencia
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