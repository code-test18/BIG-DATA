import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import MainLayout from '../layouts/MainLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import RequireRole from '../components/RequireRole';

const Home = lazy(() => import('../pages/Home'));
const About = lazy(() => import('../pages/About'));
const Services = lazy(() => import('../pages/Services'));
const Contact = lazy(() => import('../pages/Contact'));
const Login = lazy(() => import('../pages/login/Login'));
const Registro = lazy(() => import('../pages/login/Registro'));

const Inicio = lazy(() => import('../pages/dashboard/Inicio'));
const Ventas = lazy(() => import('../pages/dashboard/Ventas'));
const Procesar = lazy(() => import('../pages/dashboard/proceso/Procesar'));
const LimpiarDatos = lazy(() => import('../pages/dashboard/LimpiarDatos'));
const Reportes = lazy(() => import('../pages/dashboard/Reportes'));
const Inteligencia = lazy(() => import('../pages/dashboard/Inteligencia'));
const Solicitudes = lazy(() => import('../pages/dashboard/Solicitudes'));
const Tareas = lazy(() => import('../pages/dashboard/Tareas'));

function AppRoutes() {
  return (
    <Suspense fallback={<div className="p-4 text-center">Cargando módulo...</div>}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/nosotros" element={<About />} />
          <Route path="/servicios" element={<Services />} />
          <Route path="/contacto" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
        </Route>

        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Navigate to="inicio" replace />} />
          <Route path="inicio" element={<Inicio />} />
          <Route path="procesar" element={<RequireRole allowed={['ANALISTA']}><Procesar /></RequireRole>} />
          <Route path="ventas" element={<RequireRole allowed={['ANALISTA']}><Ventas /></RequireRole>} />
          <Route path="limpiar" element={<RequireRole allowed={['ANALISTA']}><LimpiarDatos /></RequireRole>} />
          <Route path="limpiardatos" element={<RequireRole allowed={['ANALISTA']}><LimpiarDatos /></RequireRole>} />
          <Route path="reportes" element={<Reportes />} />
          <Route path="tareas" element={<RequireRole allowed={['ANALISTA', 'TRABAJADOR']}><Tareas /></RequireRole>} />
          <Route path="inteligencia" element={<RequireRole allowed={['TRABAJADOR']}><Inteligencia /></RequireRole>} />
          <Route path="solicitudes" element={<RequireRole allowed={['ANALISTA']}><Solicitudes /></RequireRole>} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;