import LZString from 'lz-string';
import type { Grupo, Jugador, Partido, Regla, TipoRegla } from './tipos';
import { jugadorNuevo } from './almacen';
import { nuevoId } from './id';

/**
 * No hay servidor, así que todo lo compartible viaja adentro del link.
 *
 * Dos formatos, cada uno con su prefijo en el fragmento (#) — el fragmento
 * nunca se manda al servidor, así que ni los nombres de tu grupo ni los del
 * sorteo quedan en ningún log:
 *
 *   #g=<...>   El plantel entero: para invitar a otro a "unirse" al grupo.
 *   #s=<...>   Un sorteo puntual: los equipos ya armados con sus nombres,
 *              para pasar el resultado por WhatsApp y que quien lo abra vea
 *              exactamente los equipos que salieron, aunque no tenga el
 *              grupo en su teléfono.
 */

const VERSION = 1;

// ─── Plantel (compartir grupo) ─────────────────────────────────────────────

type PaqueteGrupo = [
  version: number,
  id: string,
  nombre: string,
  cancha: number,
  jugadores: [nombre: string, nivel: number, banderas: number][],
  reglas: [tipo: number, a: number, b: number][],
];

export function codificarGrupo(grupo: Grupo): string {
  const indiceDe = new Map(grupo.jugadores.map((j, i) => [j.id, i]));

  const paquete: PaqueteGrupo = [
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
    const paquete = JSON.parse(crudo) as PaqueteGrupo;
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

// ─── Sorteo (compartir resultado) ──────────────────────────────────────────

type PaqueteSorteo = [
  version: number,
  nombreGrupo: string,
  cancha: number,
  fechaISO: string,
  semilla: number,
  // Jugadores del sorteo (nombre, nivel, es arquero): los equipos apuntan por índice.
  jugadores: [nombre: string, nivel: number, arqueroFlag: 0 | 1][],
  // Cada equipo es una tira de índices apuntando al array de jugadores.
  equipos: [pecheraId: string, indices: number[]][],
];

/** El sorteo hidratado que se muestra cuando alguien abre un link compartido. */
export interface SorteoCompartido {
  nombreGrupo: string;
  cancha: number;
  fecha: string;
  semilla: number;
  jugadores: Jugador[];
  equipos: { pechera: string; jugadores: Jugador[] }[];
}

export function codificarSorteo(grupo: Grupo, sorteo: Partido): string {
  // Sólo empaquetamos los jugadores que efectivamente juegan en este sorteo.
  const idsEnSorteo = new Set(sorteo.equipos.flatMap((e) => e.jugadores));
  const jugadoresDelSorteo = grupo.jugadores.filter((j) => idsEnSorteo.has(j.id));
  const indiceDe = new Map(jugadoresDelSorteo.map((j, i) => [j.id, i]));

  const paquete: PaqueteSorteo = [
    VERSION,
    grupo.nombre,
    grupo.cancha,
    sorteo.fecha,
    sorteo.semilla,
    jugadoresDelSorteo.map((j) => [j.nombre, j.nivel, j.arquero ? 1 : 0]),
    sorteo.equipos.map((e) => [
      e.pechera,
      e.jugadores.map((id) => indiceDe.get(id)).filter((i): i is number => i !== undefined),
    ]),
  ];

  return LZString.compressToEncodedURIComponent(JSON.stringify(paquete));
}

export function decodificarSorteo(payload: string): SorteoCompartido | null {
  try {
    const crudo = LZString.decompressFromEncodedURIComponent(payload);
    if (!crudo) return null;
    const paquete = JSON.parse(crudo) as PaqueteSorteo;
    if (!Array.isArray(paquete) || paquete[0] !== VERSION) return null;

    const [, nombreGrupo, cancha, fecha, semilla, jugadoresCrudos, equiposCrudos] = paquete;
    if (!Array.isArray(jugadoresCrudos) || !Array.isArray(equiposCrudos)) return null;

    const jugadores = jugadoresCrudos.map(([nom, nivel, arq]) => {
      const j = jugadorNuevo(String(nom).slice(0, 40), Math.min(10, Math.max(1, Number(nivel) || 5)));
      j.arquero = arq === 1;
      return j;
    });

    const equipos = equiposCrudos
      .map(([pechera, indices]) => ({
        pechera: String(pechera).slice(0, 20),
        jugadores: indices.map((i) => jugadores[i]).filter((j): j is Jugador => Boolean(j)),
      }))
      .filter((e) => e.jugadores.length > 0);

    if (equipos.length < 2) return null;

    return {
      nombreGrupo: String(nombreGrupo ?? 'Grupo compartido').slice(0, 60),
      cancha: Math.min(11, Math.max(2, Number(cancha) || 5)),
      fecha: String(fecha ?? new Date().toISOString()),
      semilla: Number(semilla) || 0,
      jugadores,
      equipos,
    };
  } catch {
    return null;
  }
}

export function enlaceDelSorteo(grupo: Grupo, sorteo: Partido): string {
  const base = `${window.location.origin}/g/${grupo.id}/sorteo`;
  return `${base}#s=${codificarSorteo(grupo, sorteo)}`;
}

// ─── Rutas y hash ──────────────────────────────────────────────────────────

export function payloadDelHash(hash: string): string | null {
  const limpio = hash.startsWith('#') ? hash.slice(1) : hash;
  const parametros = new URLSearchParams(limpio);
  return parametros.get('g');
}

export function payloadSorteoDelHash(hash: string): string | null {
  const limpio = hash.startsWith('#') ? hash.slice(1) : hash;
  const parametros = new URLSearchParams(limpio);
  return parametros.get('s');
}
