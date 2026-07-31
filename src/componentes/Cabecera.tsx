import { useLayoutEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import type { Grupo } from '../lib/tipos';
import { Sello, TiraFormulario } from './Piezas';

/** El nombre del grupo se escribe encima del título y crece de renglón si hace falta. */
function TituloEditable({ valor, onCambio }: { valor: string; onCambio: (nombre: string) => void }) {
  const campo = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = campo.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [valor]);

  return (
    <textarea
      ref={campo}
      id="nombre-grupo"
      className="titulo-editable"
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
    <>
      <TiraFormulario derecha={`Fútbol ${grupo.cancha}`} />

      <header className="cabecera margen">
        <p className="etiqueta">
          <NavLink to="/" className="volver">
            ← Todas las planillas
          </NavLink>
        </p>

        {/* El título del documento va como h1 aunque el campo visible sea editable. */}
        <h1 className="solo-lectores">{grupo.nombre}</h1>

        <div className="cabecera__marca">
          <div className="cabecera__nombre">
            <label className="etiqueta" htmlFor="nombre-grupo">
              Grupo
            </label>
            <TituloEditable valor={grupo.nombre} onCambio={onRenombrar} />
          </div>
          <Sello codigo={grupo.id} />
        </div>

        <nav className="solapas" aria-label="Secciones del grupo">
          <NavLink to={`/g/${grupo.id}`} end className="solapa">
            Plantel <span className="dato">({anotados})</span>
          </NavLink>
          <NavLink
            to={`/g/${grupo.id}/${enSorteo ? 'sorteo' : 'armar'}`}
            className="solapa"
            aria-current={enSorteo ? 'page' : undefined}
          >
            Sortear
          </NavLink>
          <NavLink to={`/g/${grupo.id}/historial`} className="solapa">
            Historial <span className="dato">({grupo.partidos.length})</span>
          </NavLink>
        </nav>
      </header>
    </>
  );
}
