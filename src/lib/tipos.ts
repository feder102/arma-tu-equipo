export type JugadorId = string;

/** Un jugador del plantel. El nivel es 1 a 10, como en la planilla. */
export interface Jugador {
  id: JugadorId;
  nombre: string;
  nivel: number;
  arquero: boolean;
  /** Un jugador dado de baja deja de aparecer al anotarse, pero no borra el historial. */
  activo: boolean;
  creado: number;
}

export type TipoRegla = 'juntos' | 'separados';

/** "Estos dos siempre juntos" / "estos dos nunca en el mismo equipo". */
export interface Regla {
  id: string;
  tipo: TipoRegla;
  a: JugadorId;
  b: JugadorId;
}

export interface EquipoPartido {
  pechera: string;
  jugadores: JugadorId[];
  goles: number | null;
}

export interface Partido {
  id: string;
  fecha: string;
  semilla: number;
  equipos: EquipoPartido[];
  /** Cuántos repartos igual de parejos había cuando salió éste. */
  variantes?: number;
  nota: string;
}

export interface Grupo {
  /** Código corto e irrepetible, del estilo 7K2M9X. Es también la clave local. */
  id: string;
  nombre: string;
  /** Jugadores por equipo que juega este grupo habitualmente: 5, 7, 11, lo que sea. */
  cancha: number;
  jugadores: Jugador[];
  reglas: Regla[];
  partidos: Partido[];
  /** El sorteo recién tirado, todavía sin guardar en el historial. */
  sorteoActual: Partido | null;
  creado: number;
  actualizado: number;
}
