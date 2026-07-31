import type { Jugador } from '../lib/tipos';
import { pechera } from '../lib/pecheras';
import { formatearNivel } from './Piezas';

/**
 * La tarjeta de un equipo, después del sorteo.
 *
 * Se piensa como el pizarrón del vestuario: color de pechera arriba, la lista
 * con formato de planilla de convocatoria — dorsal a la izquierda (con el "1"
 * clavado para el arquero, como manda la costumbre), apellido, nivel a la
 * derecha. El "fijo" clava al jugador para el próximo sorteo, y se muestra sólo
 * cuando cambió: en reposo se mantiene invisible para no ensuciar la lectura.
 */
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
        <span className="pechera__rotulo">Equipo {String.fromCharCode(65 + indice)}</span>
        <h3 className="pechera__nombre display">{p.nombre}</h3>
        <p className="pechera__promedio">
          <span className="pechera__promedio-r">Nivel promedio</span>
          <span className="pechera__promedio-v">{formatearNivel(promedio)}</span>
        </p>
      </header>

      <ol className="pechera__lista">
        {jugadores.map((j, i) => {
          const fijo = fijados[j.id] === indice;
          // El arquero se anota con el 1 histórico; el resto con dorsal en orden.
          const dorsal = j.arquero ? 1 : i + (jugadores[0]?.arquero ? 1 : 2);
          return (
            <li
              key={j.id}
              className={`pechera__jugador${j.arquero ? ' pechera__jugador--arq' : ''}`}
              style={{ '--linea': i, '--orden': indice } as React.CSSProperties}
            >
              <span className="pechera__dorsal">{dorsal}</span>
              <span className="pechera__apellido">{j.nombre}</span>
              {j.arquero && (
                <span className="pechera__arq" title="Ataja">
                  arq
                </span>
              )}
              <span className="pechera__nivel">{j.nivel}</span>
              <button
                type="button"
                className="clavo"
                aria-pressed={fijo}
                onClick={() => onFijar(j.id, fijo ? null : indice)}
                title={fijo ? 'Queda en este equipo al volver a sortear' : 'Dejarlo clavado en este equipo'}
              >
                {fijo ? 'fijo' : 'fijar'}
              </button>
            </li>
          );
        })}
      </ol>
    </article>
  );
}

/**
 * El fiel de la balanza: qué tan pareja quedó la fuerza entre equipos.
 *
 * Se lee como el marcador de un partido — dos bloques a lo ancho, el color de
 * cada equipo, y debajo el resumen en el idioma del vestuario.
 */
export function Balanza({ fuerzas, diferencia }: { fuerzas: number[]; diferencia: number }) {
  const total = fuerzas.reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="balanza">
      <div className="balanza__lectura">
        <p className="etiqueta">Cómo quedó repartida la fuerza</p>
        <span className={`balanza__veredicto${diferencia < 0.05 ? ' balanza__veredicto--clavado' : ''}`}>
          {diferencia < 0.05 ? 'Clavados' : diferencia < 0.35 ? 'Parejo' : 'Aceptable'}
        </span>
      </div>
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
      <p className="balanza__detalle dato">
        {diferencia < 0.05
          ? 'Mismo nivel promedio en cada equipo — imposible más parejo.'
          : `Se llevan ${formatearNivel(diferencia)} de nivel promedio.`}
      </p>
    </div>
  );
}
