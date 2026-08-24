import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import DashboardLayout from '../layouts/DashboardLayout';

import Home from '../pages/Home';
import About from '../pages/About';
import Services from '../pages/Services';
import Contact from '../pages/Contact';
import Login from '../pages/login/Login';
import Registro from '../pages/login/Registro';

import Procesar from '../pages/dashboard/Procesar';
import Reportes from '../pages/dashboard/Reportes';
import LimpiarDatos from '../pages/dashboard/LimpiarDatos';
import Inicio from '../pages/dashboard/Inicio';

function AppRoutes() {
    return (
        <Routes>
            {/*Rutas con layout (navbar + footer) */}
            <Route element={<MainLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/nosotros" element={<About />} />
                <Route path="/servicios" element={<Services />} />
                <Route path="/contacto" element={<Contact />} />
                <Route path="/login" element={<Login />} />
                <Route path="/registro" element={<Registro />} />
            </Route>

            {/* Rutas con Sidebar privado */}
            <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<Navigate to="procesar" replace />} />
                <Route path="inicio" element={<Inicio />} />
                <Route path="procesar" element={<Procesar />} />
                <Route path="limpiar" element={<LimpiarDatos />} />
                <Route path="limpiardatos" element={<LimpiarDatos />} />
                <Route path="reportes" element={<Reportes />} />
            </Route>
        </Routes>
    );
}

export default AppRoutes;