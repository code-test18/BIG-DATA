import {
  ArrowLeft,
  BarChart3,
  BrainCircuit,
  FileSpreadsheet,
  Home,
  TrendingUp,
  Upload,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h3>Mercamax Analysis</h3>
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/dashboard/Inicio" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
            <Home size={16} strokeWidth={2.2} />
            Inicio
          </span>
        </NavLink>
        <NavLink to="/dashboard/limpiardatos" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
            <Upload size={16} strokeWidth={2.2} />
            Carga y Limpieza
          </span>
        </NavLink>
        <NavLink to="/dashboard/procesar" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileSpreadsheet size={16} strokeWidth={2.2} />
            Procesar
          </span>
        </NavLink>
        <NavLink to="/dashboard/ventas" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
            <TrendingUp size={16} strokeWidth={2.2} />
            Ventas
          </span>
        </NavLink>
        <NavLink to="/dashboard/reportes" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
            <BarChart3 size={16} strokeWidth={2.2} />
            Reportes
          </span>
        </NavLink>
        <NavLink to="/dashboard/Inteligencia" className="sidebar-link">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
            <BrainCircuit size={16} strokeWidth={2.2} />
            Negocio/Inteligencia
          </span>
        </NavLink>
      </nav>
      <div className="sidebar-footer">
        <NavLink to="/" className="sidebar-link back-link">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
            <ArrowLeft size={16} strokeWidth={2.2} />
            Volver al sitio
          </span>
        </NavLink>
      </div>
    </aside>
  );
}

export default Sidebar;