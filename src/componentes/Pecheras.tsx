import type { Jugador } from '../lib/tipos';
import { pechera } from '../lib/pecheras';
import { formatearNivel } from './Piezas';

export function TarjetaPechera({
  indice,
  jugadores,
  promedio,
  fijados,
  onFijar,
}: {
  indice: number;
  jugadores: Jugador[];
  promedio: number;
  fijados: Record<string, number>;
  onFijar: (id: string, equipo: number | null) => void;
}) {
  const p = pechera(indice);

  return (
    <article
      className="pechera"
      style={
        {
          '--orden': indice,
          '--tela': p.tela,
          '--tinta-pechera': p.tinta,
        } as React.CSSProperties
      }
    >
      <header className="pechera__cuello">
        <h3 className="pechera__nombre">{p.nombre}</h3>
        <p className="pechera__promedio">
          Nivel<b>{formatearNivel(promedio)}</b>
        </p>
      </header>

      <ol className="pechera__lista">
        {jugadores.map((j, i) => {
          const fijo = fijados[j.id] === indice;
          return (
            <li
              key={j.id}
              className="pechera__jugador"
              style={{ '--linea': i, '--orden': indice } as React.CSSProperties}
            >
              <span className="pechera__dorsal">{String(i + 1).padStart(2, '0')}</span>
              <span className="pechera__apellido">
                {j.nombre}
                {j.arquero && <span className="pechera__arq"> ARQ</span>}
              </span>
              <span className="pechera__marca">
                {j.nivel}
                <button
                  type="button"
                  className="clavo"
                  aria-pressed={fijo}
                  onClick={() => onFijar(j.id, fijo ? null : indice)}
                  title={fijo ? 'Queda en este equipo al volver a sortear' : 'Dejarlo clavado en este equipo'}
                >
                  fijo
                </button>
              </span>
            </li>
          );
        })}
      </ol>
    </article>
  );
}

export function Balanza({ fuerzas, diferencia }: { fuerzas: number[]; diferencia: number }) {
  const total = fuerzas.reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="balanza">
      <p className="etiqueta">Cómo quedó repartida la fuerza</p>
      <div
        className="balanza__barras"
        role="img"
        aria-label={`Fuerza por equipo: ${fuerzas.map((f) => f.toFixed(0)).join(', ')}`}
      >
        {fuerzas.map((f, i) => (
          <div
            key={i}
            className="balanza__parte"
            style={{ flexGrow: f / total, background: pechera(i).tela }}
          />
        ))}
      </div>
      <p className="balanza__lectura">
        <span className="dato">
          {diferencia < 0.05
            ? 'Quedaron clavados: mismo nivel promedio.'
            : `Se llevan ${formatearNivel(diferencia)} de nivel promedio.`}
        </span>
        <span className="etiqueta">{diferencia < 0.35 ? 'Parejo' : 'Aceptable'}</span>
      </p>
    </div>
  );
}
