import type { Grupo, Jugador } from './tipos';
import { codigoGrupo, nuevoId } from './id';

const CLAVE = 'ate.v1';

interface Base {
  version: 1;
  grupos: Grupo[];
}

const BASE_VACIA: Base = { version: 1, grupos: [] };

/** Si el navegador no deja escribir (modo incógnito, storage lleno) seguimos en memoria. */
let memoria: Base | null = null;

function almacenamiento(): Storage | null {
  try {
    const prueba = '__ate__';
    window.localStorage.setItem(prueba, '1');
    window.localStorage.removeItem(prueba);
    return window.localStorage;
  } catch {
    return null;
  }
}

export function hayGuardadoPersistente(): boolean {
  return almacenamiento() !== null;
}

export function leerBase(): Base {
  if (memoria) return memoria;
  const store = almacenamiento();
  if (!store) {
    memoria = structuredClone(BASE_VACIA);
    return memoria;
  }
  try {
    const crudo = store.getItem(CLAVE);
    if (!crudo) return structuredClone(BASE_VACIA);
    const datos = JSON.parse(crudo) as Base;
    if (!datos || !Array.isArray(datos.grupos)) return structuredClone(BASE_VACIA);
    return { version: 1, grupos: datos.grupos.map(sanear) };
  } catch {
    return structuredClone(BASE_VACIA);
  }
}

export function guardarBase(base: Base): void {
  const store = almacenamiento();
  if (!store) {
    memoria = base;
    return;
  }
  try {
    store.setItem(CLAVE, JSON.stringify(base));
  } catch {
    memoria = base;
  }
}

/** Rellena lo que falte para que un grupo viejo o importado no rompa la app. */
function sanear(grupo: Partial<Grupo>): Grupo {
  return {
    id: grupo.id ?? codigoGrupo(),
    nombre: grupo.nombre ?? 'Sin nombre',
    cancha: grupo.cancha ?? 5,
    jugadores: (grupo.jugadores ?? []).map((j) => ({
      id: j.id ?? nuevoId(),
      nombre: j.nombre ?? '',
      nivel: Math.min(10, Math.max(1, Math.round(j.nivel ?? 5))),
      arquero: Boolean(j.arquero),
      activo: j.activo !== false,
      creado: j.creado ?? Date.now(),
    })),
    reglas: grupo.reglas ?? [],
    partidos: grupo.partidos ?? [],
    sorteoActual: grupo.sorteoActual ?? null,
    creado: grupo.creado ?? Date.now(),
    actualizado: grupo.actualizado ?? Date.now(),
  };
}

export function grupoNuevo(nombre: string, cancha: number): Grupo {
  const ahora = Date.now();
  return {
    id: codigoGrupo(),
    nombre: nombre.trim() || 'Mi fútbol',
    cancha,
    jugadores: [],
    reglas: [],
    partidos: [],
    sorteoActual: null,
    creado: ahora,
    actualizado: ahora,
  };
}

export function jugadorNuevo(nombre: string, nivel = 5, arquero = false): Jugador {
  return {
    id: nuevoId(),
    nombre: nombre.trim(),
    nivel,
    arquero,
    activo: true,
    creado: Date.now(),
  };
}

export function normalizarNombre(nombre: string): string {
  return nombre
    .trim()
    .toLowerCase()
    .normalize('NFD')
    // Sacamos tildes para que "Nicolás" y "Nicolas" no entren dos veces al plantel.
    .replace(/[̀-ͯ]/g, '');
}
