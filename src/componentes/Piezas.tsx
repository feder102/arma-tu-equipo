import { useCallback, useRef, useState } from 'react';
import type { ReactNode } from 'react';

/**
 * El código del grupo, impreso como una entrada de cancha con su troquel.
 * Cuando alguien te pide el código, éste es el que dictás.
 */
export function Entrada({ codigo }: { codigo: string }) {
  return (
    <div className="entrada" title={`Código del grupo: ${codigo}`}>
      <span className="entrada__rotulo">código</span>
      <span className="entrada__codigo display">{codigo}</span>
    </div>
  );
}

/** Diez barras que suben como la tribuna: se marca hasta donde tocás. */
export function Nivel({
  valor,
  onCambio,
  nombre,
}: {
  valor: number;
  onCambio: (nivel: number) => void;
  nombre: string;
}) {
  return (
    <div className="jugador__nivel">
      <div className="nivel" role="group" aria-label={`Nivel de ${nombre}`}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            className="nivel__casillero"
            data-marcado={n <= valor ? 'si' : 'no'}
            aria-pressed={n === valor}
            aria-label={`Nivel ${n} de 10`}
            onClick={() => onCambio(n)}
          />
        ))}
      </div>
      <span className="nivel__valor" aria-hidden="true">
        {valor}
      </span>
    </div>
  );
}

/** Los totales del grupo, en el renglón de campos de un formulario. */
export function Resumen({ campos }: { campos: { rotulo: string; valor: ReactNode }[] }) {
  return (
    <dl className="resumen">
      {campos.map((campo) => (
        <div key={campo.rotulo} className="resumen__campo">
          <dt className="etiqueta">{campo.rotulo}</dt>
          <dd className="resumen__valor">{campo.valor}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Seccion({
  titulo,
  cuenta,
  children,
}: {
  titulo: string;
  cuenta?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="seccion">
      <div className="seccion__cabeza">
        <h2 className="seccion__titulo display">{titulo}</h2>
        {cuenta !== undefined && <div className="seccion__cuenta">{cuenta}</div>}
      </div>
      {children}
    </section>
  );
}

/** Copia al portapapeles y avisa por dos segundos. */
export function useCopiar(): [boolean, (texto: string) => Promise<void>] {
  const [copiado, setCopiado] = useState(false);
  const reloj = useRef<number | undefined>(undefined);

  const copiar = useCallback(async (texto: string) => {
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      // Sin permiso de portapapeles (o sin HTTPS): dejamos el texto seleccionado a mano.
      const area = document.createElement('textarea');
      area.value = texto;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      try {
        document.execCommand('copy');
      } catch {
        /* el usuario copia a mano desde el cuadro de abajo */
      }
      document.body.removeChild(area);
    }
    setCopiado(true);
    window.clearTimeout(reloj.current);
    reloj.current = window.setTimeout(() => setCopiado(false), 2000);
  }, []);

  return [copiado, copiar];
}

export function formatearNivel(n: number): string {
  return n.toFixed(1).replace('.', ',');
}

export function formatearFecha(iso: string): string {
  const fecha = new Date(iso);
  return fecha.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}
