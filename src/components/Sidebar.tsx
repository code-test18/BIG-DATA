import {
  ArrowLeft,
  BarChart3,
  BrainCircuit,
  ClipboardList,
  FileSpreadsheet,
  Home,
  MessageSquareText,
  TrendingUp,
  Upload,
  Users,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';
import type { Role } from '../services/authService';

interface NavItem {
  to: string;
  label: string;
  icon: typeof Home;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard/inicio', label: 'Inicio', icon: Home, roles: ['ANALISTA', 'TRABAJADOR'] },
  { to: '/dashboard/limpiardatos', label: 'Carga y Limpieza', icon: Upload, roles: ['ANALISTA'] },
  { to: '/dashboard/procesar', label: 'Procesar', icon: FileSpreadsheet, roles: ['ANALISTA'] },
  { to: '/dashboard/ventas', label: 'Ventas', icon: TrendingUp, roles: ['ANALISTA'] },
  { to: '/dashboard/reportes', label: 'Reportes', icon: BarChart3, roles: ['ANALISTA', 'TRABAJADOR'] },
  { to: '/dashboard/tareas', label: 'Tareas', icon: ClipboardList, roles: ['ANALISTA', 'TRABAJADOR'] },
  { to: '/dashboard/solicitudes', label: 'Solicitudes', icon: MessageSquareText, roles: ['ANALISTA'] },
  { to: '/dashboard/inteligencia', label: 'Negocio/Inteligencia', icon: BrainCircuit, roles: ['TRABAJADOR'] },
  { to: '/dashboard/trabajadores', label: 'Equipo', icon: Users, roles: ['ANALISTA'] },
];

function Sidebar() {
  const usuario = getCurrentUser();
  const visibles = NAV_ITEMS.filter((item) => !usuario || item.roles.includes(usuario.role));

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h3>Mercamax Analysis</h3>
      </div>
      <nav className="sidebar-nav">
        {visibles.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
              <Icon size={16} strokeWidth={2.2} />
              {label}
            </span>
          </NavLink>
        ))}
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