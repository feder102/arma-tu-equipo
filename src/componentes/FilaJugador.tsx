import { useEffect, useRef, useState } from 'react';
import type { Jugador } from '../lib/tipos';
import { Nivel } from './Piezas';

/**
 * Un renglón del plantel — el equivalente a una línea de la lista de convocados.
 *
 * Se lee de izquierda a derecha como una entrada de planilla real: número de
 * orden, nombre escrito con birome, la escala de nivel, y las tres cosas que
 * podés hacerle a ese jugador (marcarlo arquero, darlo de baja para este
 * partido, borrarlo del plantel entero).
 */
export function FilaJugador({
  jugador,
  numero,
  onCambiar,
  onBorrar,
}: {
  jugador: Jugador;
  numero: number;
  onCambiar: (cambios: Partial<Jugador>) => void;
  onBorrar: () => void;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const reloj = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(reloj.current), []);

  function pedirBorrado() {
    if (confirmando) {
      onBorrar();
      return;
    }
    setConfirmando(true);
    reloj.current = window.setTimeout(() => setConfirmando(false), 3500);
  }

  return (
    <li className={jugador.activo ? 'jugador' : 'jugador jugador--baja'}>
      <span className="jugador__numero display" aria-hidden="true">
        {String(numero).padStart(2, '0')}
      </span>

      <input
        className="jugador__nombre"
        value={jugador.nombre}
        onChange={(e) => onCambiar({ nombre: e.target.value })}
        maxLength={30}
        spellCheck={false}
        aria-label={`Nombre del jugador ${numero}`}
      />

      <Nivel
        valor={jugador.nivel}
        nombre={jugador.nombre || `jugador ${numero}`}
        onCambio={(nivel) => onCambiar({ nivel })}
      />

      <span className="jugador__acciones">
        <button
          type="button"
          className="marca"
          aria-pressed={jugador.arquero}
          onClick={() => onCambiar({ arquero: !jugador.arquero })}
          title={jugador.arquero ? 'Es arquero' : 'Marcarlo como arquero'}
        >
          <span className="marca__glifo" aria-hidden="true">
            1
          </span>
          <span className="marca__rotulo">Arq</span>
        </button>
        <button
          type="button"
          className="marca"
          aria-pressed={!jugador.activo}
          onClick={() => onCambiar({ activo: !jugador.activo })}
          title={jugador.activo ? 'Darlo de baja del plantel' : 'Volver a sumarlo al plantel'}
        >
          <span className="marca__glifo" aria-hidden="true">
            —
          </span>
          <span className="marca__rotulo">Baja</span>
        </button>
        <button
          type="button"
          className={confirmando ? 'tachar tachar--confirma' : 'tachar'}
          onClick={pedirBorrado}
          aria-label={`Borrar a ${jugador.nombre || `jugador ${numero}`}`}
          title={confirmando ? 'Tocá de nuevo para confirmar' : 'Borrar del plantel'}
        >
          <span aria-hidden="true">{confirmando ? '¿?' : '×'}</span>
        </button>
      </span>
    </li>
  );
}
