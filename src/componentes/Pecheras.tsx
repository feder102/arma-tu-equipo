import type { Jugador } from '../lib/tipos';
import { pechera } from '../lib/pecheras';
import { formatearNivel } from './Piezas';

/** El arquero se anota con el 1 histórico; el resto con dorsal en orden. */
function dorsales(jugadores: Jugador[]): number[] {
  return jugadores.map((j, i) => (j.arquero ? 1 : i + (jugadores[0]?.arquero ? 1 : 2)));
}

/** La silueta de una camiseta, pintada con el color de la pechera y el dorsal en el pecho. */
export function Camiseta({
  indice = 0,
  dorsal,
  arquero,
  neutra,
}: {
  indice?: number;
  dorsal: number;
  arquero?: boolean;
  /** Sin pechera todavía: la camiseta gris del plantel, antes del sorteo. */
  neutra?: boolean;
}) {
  const p = neutra ? { tela: 'var(--cal-3)', tinta: 'var(--tinta)' } : pechera(indice);
  return (
    <svg className="camiseta" viewBox="0 0 40 40" aria-hidden="true">
      <path
        d="M14 4 8 6.5 2 12.5l4.5 6 3.5-2.5V37h20V16l3.5 2.5 4.5-6-6-6L26 4c-1.2 2.6-3.4 4-6 4s-4.8-1.4-6-4Z"
        fill={arquero ? 'var(--amarilla)' : p.tela}
        stroke={arquero ? 'var(--tinta)' : p.tinta}
        strokeOpacity="0.55"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <text
        x="20"
        y="29"
        textAnchor="middle"
        fill={arquero ? 'var(--tinta)' : p.tinta}
        className="camiseta__dorsal"
      >
        {dorsal}
      </text>
    </svg>
  );
}

/** Cómo se paran los de campo según cuántos son: de atrás hacia adelante. */
function lineas(cantidad: number): number[] {
  if (cantidad <= 0) return [];
  if (cantidad <= 3) return [cantidad];
  if (cantidad === 4) return [2, 2];
  if (cantidad <= 6) return [3, cantidad - 3];
  if (cantidad <= 8) return [3, 3, cantidad - 6];
  if (cantidad <= 10) return [4, 3, cantidad - 7];
  const resto: number[] = [];
  for (let n = cantidad; n > 0; n -= 4) resto.push(Math.min(4, n));
  return resto;
}

interface Ubicado {
  jugador: Jugador;
  dorsal: number;
  x: number;
  y: number;
}

function formacion(jugadores: Jugador[], arriba: boolean): Ubicado[] {
  const numeros = dorsales(jugadores);
  const conDorsal = jugadores.map((jugador, i) => ({ jugador, dorsal: numeros[i] }));
  const arqueroIdx = conDorsal.findIndex((c) => c.jugador.arquero);
  const arquero = arqueroIdx >= 0 ? conDorsal[arqueroIdx] : null;
  const campo = conDorsal.filter((_, i) => i !== arqueroIdx);

  // Cada equipo usa su mitad: el arco en la punta, las líneas hasta cerca del medio.
  const aY = (t: number) => (arriba ? t : 100 - t);
  const ubicados: Ubicado[] = [];
  if (arquero) ubicados.push({ ...arquero, x: 50, y: aY(7) });

  const filas = lineas(campo.length);
  const desde = 19;
  const hasta = 42;
  let cursor = 0;
  filas.forEach((enFila, f) => {
    const y = filas.length === 1 ? (desde + hasta) / 2 : desde + ((hasta - desde) * f) / (filas.length - 1);
    for (let k = 0; k < enFila; k++) {
      ubicados.push({ ...campo[cursor++], x: ((k + 1) * 100) / (enFila + 1), y: aY(y) });
    }
  });
  return ubicados;
}

/**
 * El sorteo dibujado en la cancha: cada equipo en su mitad, parado en formación,
 * con la camiseta del color de su pechera. Sólo tiene sentido con dos equipos.
 */
export function CanchaSorteo({ equipos }: { equipos: Jugador[][] }) {
  if (equipos.length !== 2) return null;
  const ubicados = [formacion(equipos[0], true), formacion(equipos[1], false)];

  return (
    <figure className="cancha-sorteo" aria-hidden="true">
      <svg className="cancha-sorteo__lineas" viewBox="0 0 200 300" preserveAspectRatio="none">
        <g fill="none" stroke="currentColor" strokeWidth="1.4">
          <rect x="8" y="8" width="184" height="284" />
          <line x1="8" y1="150" x2="192" y2="150" />
          <circle cx="100" cy="150" r="26" />
          <rect x="48" y="8" width="104" height="44" />
          <rect x="76" y="8" width="48" height="16" />
          <rect x="48" y="248" width="104" height="44" />
          <rect x="76" y="276" width="48" height="16" />
          <rect x="86" y="3" width="28" height="5" />
          <rect x="86" y="292" width="28" height="5" />
        </g>
        <g fill="currentColor">
          <circle cx="100" cy="150" r="2" />
          <circle cx="100" cy="38" r="1.6" />
          <circle cx="100" cy="262" r="1.6" />
        </g>
      </svg>

      {ubicados.map((equipo, e) =>
        equipo.map(({ jugador, dorsal, x, y }, i) => (
          <div
            key={jugador.id}
            className="cancha-sorteo__jugador"
            style={{ left: `${x}%`, top: `${y}%`, '--orden': e * 6 + i } as React.CSSProperties}
          >
            <Camiseta indice={e} dorsal={dorsal} arquero={jugador.arquero} />
            <span className="cancha-sorteo__nombre">{jugador.nombre}</span>
          </div>
        )),
      )}
    </figure>
  );
}

/**
 * La tarjeta de un equipo, después del sorteo.
 *
 * Color de pechera arriba y la lista de convocados: dorsal a la izquierda (con el
 * "1" para el arquero, como manda la costumbre), nombre, nivel a la derecha. El
 * "fijar" clava al jugador para el próximo sorteo; en reposo queda en segundo plano.
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
  onFijar?: (id: string, equipo: number | null) => void;
}) {
  const p = pechera(indice);
  const numeros = dorsales(jugadores);

  return (
    <article
      className="pechera"
      style={
        {
          '--tela': p.tela,
          '--tinta-pechera': p.tinta,
        } as React.CSSProperties
      }
    >
      <header className="pechera__cuello">
        <h3 className="pechera__nombre display">{p.nombre}</h3>
        <p className="pechera__promedio">
          <span className="pechera__promedio-r">nivel</span>
          <span className="pechera__promedio-v display">{formatearNivel(promedio)}</span>
        </p>
      </header>

      <ol className="pechera__lista">
        {jugadores.map((j, i) => {
          const fijo = fijados[j.id] === indice;
          return (
            <li key={j.id} className="pechera__jugador">
              <Camiseta indice={indice} dorsal={numeros[i]} arquero={j.arquero} />
              <span className="pechera__apellido">
                {j.nombre}
                {j.arquero && <span className="pechera__arq">ataja</span>}
              </span>
              <span className="pechera__nivel">{j.nivel}</span>
              {onFijar && (
                <button
                  type="button"
                  className="clavo"
                  aria-pressed={fijo}
                  onClick={() => onFijar(j.id, fijo ? null : indice)}
                  title={fijo ? 'Queda en este equipo al volver a sortear' : 'Dejarlo clavado en este equipo'}
                >
                  {fijo ? 'Fijo' : 'Fijar'}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </article>
  );
}

/**
 * Qué tan pareja quedó la fuerza, leído como el marcador de la tele: la sigla de
 * cada pechera con su nivel promedio, y abajo el veredicto en idioma de vestuario.
 */
export function Marcador({ promedios, diferencia }: { promedios: number[]; diferencia: number }) {
  const veredicto = diferencia < 0.05 ? 'Clavados' : diferencia < 0.35 ? 'Parejo' : 'Aceptable';

  return (
    <div className="marcador">
      <div
        className="marcador__tablero"
        role="img"
        aria-label={`Nivel promedio por equipo: ${promedios
          .map((v, i) => `${pechera(i).nombre} ${formatearNivel(v)}`)
          .join(', ')}`}
      >
        {promedios.map((valor, i) => {
          const p = pechera(i);
          return (
            <span key={i} className="marcador__casilla">
              <span
                className="marcador__equipo display"
                style={{ '--tela': p.tela, '--tinta-pechera': p.tinta } as React.CSSProperties}
              >
                {p.corto}
              </span>
              <span className="marcador__valor display">{formatearNivel(valor)}</span>
            </span>
          );
        })}
      </div>
      <p className="marcador__lectura">
        <strong className={`marcador__veredicto${diferencia < 0.05 ? ' marcador__veredicto--clavado' : ''}`}>
          {veredicto}.
        </strong>{' '}
        {diferencia < 0.05
          ? 'Mismo nivel promedio en cada equipo, imposible más parejo.'
          : `Se llevan ${formatearNivel(diferencia)} de nivel promedio.`}
      </p>
    </div>
  );
}
