import { Link } from 'react-router-dom';
import { useContextoGrupo } from './MarcoGrupo';
import { Seccion, formatearFecha } from '../componentes/Piezas';
import { PECHERAS, pechera } from '../lib/pecheras';
import type { Partido } from '../lib/tipos';

export default function Historial() {
  const { grupo, editar } = useContextoGrupo();

  function cargarGoles(partidoId: string, indice: number, goles: number | null) {
    editar((g) => ({
      ...g,
      partidos: g.partidos.map((p) =>
        p.id === partidoId
          ? { ...p, equipos: p.equipos.map((e, i) => (i === indice ? { ...e, goles } : e)) }
          : p,
      ),
    }));
  }

  function borrarPartido(partidoId: string) {
    editar((g) => ({ ...g, partidos: g.partidos.filter((p) => p.id !== partidoId) }));
  }

  if (grupo.partidos.length === 0) {
    return (
      <Seccion titulo="Historial">
        <p className="vacio">
          Todavía no guardaste ningún partido. Cuando sortees los equipos vas a poder guardarlos acá, con
          el resultado, para tener el registro de la temporada.
        </p>
        <Link to={`/g/${grupo.id}/armar`} className="boton boton--principal">
          Sortear equipos
        </Link>
      </Seccion>
    );
  }

  return (
    <Seccion
      titulo="Historial"
      cuenta={`${grupo.partidos.length} ${grupo.partidos.length === 1 ? 'partido' : 'partidos'}`}
    >
      <ul>
        {grupo.partidos.map((partido) => (
          <FilaPartido
            key={partido.id}
            partido={partido}
            nombreDe={(id) => grupo.jugadores.find((j) => j.id === id)?.nombre ?? '—'}
            onGoles={(indice, goles) => cargarGoles(partido.id, indice, goles)}
            onBorrar={() => borrarPartido(partido.id)}
          />
        ))}
      </ul>
    </Seccion>
  );
}

function FilaPartido({
  partido,
  nombreDe,
  onGoles,
  onBorrar,
}: {
  partido: Partido;
  nombreDe: (id: string) => string;
  onGoles: (indice: number, goles: number | null) => void;
  onBorrar: () => void;
}) {
  const marcador = partido.equipos.map((e) => e.goles);
  const hayMarcador = marcador.some((g) => g !== null);
  const maximo = hayMarcador ? Math.max(...marcador.map((g) => g ?? -1)) : null;
  const ganadores = partido.equipos
    .map((e, i) => (e.goles !== null && e.goles === maximo ? i : -1))
    .filter((i) => i >= 0);

  return (
    <li className="partido">
      <div className="partido__fecha">
        <span className="etiqueta">{formatearFecha(partido.fecha)}</span>
        <span className="botonera botonera--pegada">
          {hayMarcador && (
            <span className="dato partido__resultado">
              {ganadores.length === 1
                ? `Ganaron las ${pecheraNombre(ganadores[0])}`
                : 'Empataron'}
            </span>
          )}
          <button type="button" className="boton boton--pelado boton--peligro" onClick={onBorrar}>
            Borrar
          </button>
        </span>
      </div>

      <div className="partido__equipos">
        {partido.equipos.map((equipo, i) => (
          <div key={i} className="partido__equipo">
            <span className="etiqueta">
              <span className="partido__color" style={{ '--tela': colorDe(equipo.pechera, i) } as React.CSSProperties} />
              {pecheraNombre(i, equipo.pechera)}
            </span>
            <p className="partido__nombres">{equipo.jugadores.map(nombreDe).join(', ')}</p>
            <label className="partido__goles">
              <span className="etiqueta">Goles</span>
              <input
                className="campo__entrada campo__entrada--corto"
                type="number"
                min={0}
                max={99}
                inputMode="numeric"
                value={equipo.goles ?? ''}
                onChange={(e) => onGoles(i, e.target.value === '' ? null : Number(e.target.value))}
                placeholder="—"
              />
            </label>
          </div>
        ))}
      </div>
    </li>
  );
}

function pecheraNombre(indice: number, id?: string): string {
  return PECHERAS.find((p) => p.id === id)?.nombre ?? pechera(indice).nombre;
}

function colorDe(id: string, indice: number): string {
  return PECHERAS.find((p) => p.id === id)?.tela ?? pechera(indice).tela;
}
