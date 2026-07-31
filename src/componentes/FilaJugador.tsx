import { useEffect, useRef, useState } from 'react';
import type { Jugador } from '../lib/tipos';
import { Nivel } from './Piezas';

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
      <span className="jugador__numero">{String(numero).padStart(2, '0')}</span>

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
          className="insignia"
          aria-pressed={jugador.arquero}
          onClick={() => onCambiar({ arquero: !jugador.arquero })}
          title="Ataja"
        >
          Arq
        </button>
        <button
          type="button"
          className="insignia"
          aria-pressed={!jugador.activo}
          onClick={() => onCambiar({ activo: !jugador.activo })}
          title={jugador.activo ? 'Darlo de baja del plantel' : 'Volver a sumarlo al plantel'}
        >
          Baja
        </button>
        <button
          type="button"
          className={confirmando ? 'boton boton--pelado es-confirmando' : 'boton boton--pelado'}
          onClick={pedirBorrado}
          aria-label={`Borrar a ${jugador.nombre || `jugador ${numero}`}`}
        >
          {confirmando ? '¿Seguro?' : 'Borrar'}
        </button>
      </span>
    </li>
  );
}
