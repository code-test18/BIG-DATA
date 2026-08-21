import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';

import Home from '../pages/Home';
import About from '../pages/About';
import Services from '../pages/Services';
import Contact from '../pages/Contact';

function AppRoutes() {
    return (
        <Routes>
            {/*Rutas con layout (navbar + footer) */}
            <Route element={<MainLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/nosotros" element={<About />} />
                <Route path="/servicios" element={<Services />} />
                <Route path="/contacto" element={<Contact />} />
            </Route>
        </Routes>
    )
}

export default AppRoutes;