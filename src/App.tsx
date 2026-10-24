import { useEffect } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { ProveedorGrupos } from './estado/grupos';
import Inicio from './rutas/Inicio';
import MarcoGrupo from './rutas/MarcoGrupo';
import Plantel from './rutas/Plantel';
import Armar from './rutas/Armar';
import Sorteo from './rutas/Sorteo';
import Historial from './rutas/Historial';
import Unirse from './rutas/Unirse';

function AlPrincipio() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function NoExiste() {
  return (
    <div>
      <header className="banda cabecera cabecera--banda margen">
        <h1 className="cabecera__titulo display">Afuera</h1>
        <p className="cabecera__bajada">Esta dirección no existe. Volvé al inicio y arrancá de nuevo.</p>
      </header>
      <div className="margen">
        <Link to="/" className="boton boton--principal">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ProveedorGrupos>
      <AlPrincipio />
      <div className="hoja">
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/unirse" element={<Unirse />} />
          <Route path="/g/:id" element={<MarcoGrupo />}>
            <Route index element={<Plantel />} />
            <Route path="armar" element={<Armar />} />
            <Route path="sorteo" element={<Sorteo />} />
            <Route path="historial" element={<Historial />} />
          </Route>
          <Route path="*" element={<NoExiste />} />
        </Routes>

        <footer className="pie margen">
          <p className="pie__marca display">Arma tu equipo</p>
          <a
            className="firma"
            href="https://landing.vila.ar"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Hecho por VILA. Abre landing.vila.ar en una pestaña nueva"
          >
            <img
              src="/vila.webp"
              alt=""
              className="firma__logo"
              width="72"
              height="72"
              loading="lazy"
              decoding="async"
            />
            <span className="firma__texto">
              <span className="firma__hecho">hecho por</span>
              <span className="firma__nombre display">VILA</span>
            </span>
          </a>
        </footer>
      </div>
    </ProveedorGrupos>
  );
}
