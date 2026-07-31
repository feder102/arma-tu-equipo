import { useLayoutEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import type { Grupo } from '../lib/tipos';
import { Sello } from './Piezas';

/** El nombre del grupo se escribe encima del título y crece de renglón si hace falta. */
function TituloEditable({ valor, onCambio }: { valor: string; onCambio: (nombre: string) => void }) {
  const campo = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = campo.current;
    if (!el) return;

    const acomodar = () => {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    };
    acomodar();

    // Cuando el viewport se achica y el título necesita más renglones, seguimos.
    const observador = new ResizeObserver(acomodar);
    observador.observe(el);
    return () => observador.disconnect();
  }, [valor]);

  return (
    <textarea
      ref={campo}
      id="nombre-grupo"
      className="titulo-editable display"
      rows={1}
      value={valor}
      onChange={(e) => onCambio(e.target.value.replace(/\n/g, ''))}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.preventDefault();
      }}
      maxLength={40}
      spellCheck={false}
      aria-label="Nombre del grupo"
    />
  );
}

export function CabeceraGrupo({
  grupo,
  onRenombrar,
}: {
  grupo: Grupo;
  onRenombrar: (nombre: string) => void;
}) {
  const anotados = grupo.jugadores.filter((j) => j.activo).length;
  const { pathname } = useLocation();
  // El resultado del sorteo vive bajo la misma solapa que el armado.
  const enSorteo = pathname.endsWith('/sorteo');

  return (
    <header className="cabecera-grupo">
      <div className="margen cabecera-grupo__cinta">
        <NavLink to="/" className="volver">
          Todas las planillas
        </NavLink>
        <span className="dato cabecera-grupo__linea">
          Fútbol {grupo.cancha} · Plantel de {anotados}
        </span>
      </div>

      {/* El título va como h1 real aunque visualmente sea un campo editable. */}
      <h1 className="solo-lectores">{grupo.nombre}</h1>

      <div className="margen cabecera-grupo__tapa">
        <TituloEditable valor={grupo.nombre} onCambio={onRenombrar} />
        <Sello codigo={grupo.id} />
      </div>

      <nav className="margen solapas" aria-label="Secciones del grupo">
        <NavLink to={`/g/${grupo.id}`} end className="solapa">
          <span className="solapa__nombre">Plantel</span>
          <span className="solapa__cuenta dato">{anotados}</span>
        </NavLink>
        <NavLink
          to={`/g/${grupo.id}/${enSorteo ? 'sorteo' : 'armar'}`}
          className="solapa"
          aria-current={enSorteo ? 'page' : undefined}
        >
          <span className="solapa__nombre">Sortear</span>
        </NavLink>
        <NavLink to={`/g/${grupo.id}/historial`} className="solapa">
          <span className="solapa__nombre">Historial</span>
          <span className="solapa__cuenta dato">{grupo.partidos.length}</span>
        </NavLink>
      </nav>
    </header>
  );
}
