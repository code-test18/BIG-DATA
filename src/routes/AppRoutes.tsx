import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import MainLayout from '../layouts/MainLayout';
import DashboardLayout from '../layouts/DashboardLayout';

// Carga perezosa (Lazy Loading) de las páginas públicas
const Home = lazy(() => import('../pages/Home'));
const About = lazy(() => import('../pages/About'));
const Services = lazy(() => import('../pages/Services'));
const Contact = lazy(() => import('../pages/Contact'));
const Login = lazy(() => import('../pages/login/Login'));
const Registro = lazy(() => import('../pages/login/Registro'));
const Otp = lazy(() => import('../pages/login/Otp'));

// Carga perezosa (Lazy Loading) del Dashboard
const Inicio = lazy(() => import('../pages/dashboard/Inicio'));
const Procesar = lazy(() => import('../pages/dashboard/Procesar'));
const Ventas = lazy(() => import('../pages/dashboard/Ventas'));
const LimpiarDatos = lazy(() => import('../pages/dashboard/LimpiarDatos'));
const Reportes = lazy(() => import('../pages/dashboard/Reportes'));

function AppRoutes() {
  return (
    <Suspense fallback={<div className="p-4 text-center">Cargando módulo...</div>}>
      <Routes>
        {/* Rutas con layout público */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/nosotros" element={<About />} />
          <Route path="/servicios" element={<Services />} />
          <Route path="/contacto" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/otp" element={<Otp />} />
        </Route>

        {/* Rutas con Sidebar privado */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Navigate to="procesar" replace />} />
          <Route path="inicio" element={<Inicio />} />
          <Route path="procesar" element={<Procesar />} />
          <Route path="ventas" element={<Ventas />} />
          <Route path="limpiar" element={<LimpiarDatos />} />
          <Route path="limpiardatos" element={<LimpiarDatos />} />
          <Route path="reportes" element={<Reportes />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;