import LZString from 'lz-string';
import type { Grupo, Regla, TipoRegla } from './tipos';
import { jugadorNuevo } from './almacen';
import { nuevoId } from './id';

/**
 * No hay servidor, así que el grupo viaja adentro del link.
 *
 * El plantel se comprime y se cuelga del fragmento (#) de la URL: el fragmento nunca
 * se manda al servidor, así que los nombres de tu grupo no quedan en ningún log.
 * Lo que viaja es una foto del plantel, no una conexión en vivo: si después alguien
 * suma un jugador, hay que volver a pasar el link.
 */

const VERSION = 1;

type Paquete = [
  version: number,
  id: string,
  nombre: string,
  cancha: number,
  jugadores: [nombre: string, nivel: number, banderas: number][],
  reglas: [tipo: number, a: number, b: number][],
];

export function codificarGrupo(grupo: Grupo): string {
  const indiceDe = new Map(grupo.jugadores.map((j, i) => [j.id, i]));

  const paquete: Paquete = [
    VERSION,
    grupo.id,
    grupo.nombre,
    grupo.cancha,
    grupo.jugadores.map((j) => [j.nombre, j.nivel, (j.arquero ? 1 : 0) | (j.activo ? 0 : 2)]),
    grupo.reglas
      .map((r): [number, number, number] | null => {
        const a = indiceDe.get(r.a);
        const b = indiceDe.get(r.b);
        if (a === undefined || b === undefined) return null;
        return [r.tipo === 'juntos' ? 0 : 1, a, b];
      })
      .filter((r): r is [number, number, number] => r !== null),
  ];

  return LZString.compressToEncodedURIComponent(JSON.stringify(paquete));
}

export function decodificarGrupo(payload: string): Grupo | null {
  try {
    const crudo = LZString.decompressFromEncodedURIComponent(payload);
    if (!crudo) return null;
    const paquete = JSON.parse(crudo) as Paquete;
    if (!Array.isArray(paquete) || paquete[0] !== VERSION) return null;

    const [, id, nombre, cancha, jugadoresCrudos, reglasCrudas] = paquete;
    if (typeof id !== 'string' || !Array.isArray(jugadoresCrudos)) return null;

    const jugadores = jugadoresCrudos.map(([nom, nivel, banderas]) => {
      const j = jugadorNuevo(String(nom).slice(0, 40), Math.min(10, Math.max(1, Number(nivel) || 5)));
      j.arquero = (banderas & 1) === 1;
      j.activo = (banderas & 2) === 0;
      return j;
    });

    const reglas: Regla[] = (reglasCrudas ?? [])
      .filter(([, a, b]) => jugadores[a] && jugadores[b])
      .map(([tipo, a, b]) => ({
        id: nuevoId(),
        tipo: (tipo === 0 ? 'juntos' : 'separados') as TipoRegla,
        a: jugadores[a].id,
        b: jugadores[b].id,
      }));

    const ahora = Date.now();
    return {
      id: String(id).slice(0, 12),
      nombre: String(nombre ?? 'Grupo importado').slice(0, 60),
      cancha: Math.min(11, Math.max(2, Number(cancha) || 5)),
      jugadores,
      reglas,
      partidos: [],
      sorteoActual: null,
      creado: ahora,
      actualizado: ahora,
    };
  } catch {
    return null;
  }
}

export function enlaceDeGrupo(grupo: Grupo): string {
  const base = `${window.location.origin}/unirse`;
  return `${base}#g=${codificarGrupo(grupo)}`;
}

export function payloadDelHash(hash: string): string | null {
  const limpio = hash.startsWith('#') ? hash.slice(1) : hash;
  const parametros = new URLSearchParams(limpio);
  return parametros.get('g');
}
