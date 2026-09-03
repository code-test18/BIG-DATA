import { NavLink } from 'react-router-dom';

function Navbar() {
    return (
        <header>
            <div className='container navbar-content'>
                <h1 className='logo'>BigData</h1>
                <nav>
                    <NavLink to="/" className="nav-link">Inicio</NavLink>
                    <NavLink to="/nosotros" className="nav-link">Nosotros</NavLink>
                    <NavLink to="/servicios" className="nav-link">Servicios</NavLink>
                    <NavLink to="/contacto" className="nav-link">Contacto</NavLink>
                    <NavLink to="/login" className="nav-link nav-btn">Iniciar Sesión</NavLink>
                </nav>
            </div>
        </header>
    );
}

export default Navbar;