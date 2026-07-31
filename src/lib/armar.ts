import type { JugadorId, Regla } from './tipos';

/**
 * Sorteo equilibrado.
 *
 * La idea: no queremos el reparto "más justo posible" (ése sería siempre el mismo
 * y el fútbol se volvería aburrido), queremos uno tomado al azar de entre todos los
 * repartos que están igual de parejos. Por eso el motor arranca muchas veces desde
 * posiciones aleatorias, optimiza cada una a fondo, junta todas las soluciones que
 * empatan en calidad y recién ahí tira la moneda.
 */

export interface JugadorSorteo {
  id: JugadorId;
  nivel: number;
  arquero: boolean;
}

export interface OpcionesSorteo {
  jugadores: JugadorSorteo[];
  equipos: number;
  reglas?: Regla[];
  /** Jugadores clavados a un equipo: { idJugador: indiceEquipo }. */
  fijados?: Record<JugadorId, number>;
  /** Misma semilla, mismo sorteo. Si no viene, se elige una al azar. */
  semilla?: number;
  /** Repartir los arqueros de a uno por equipo antes de equilibrar el resto. */
  repartirArqueros?: boolean;
  /** Cuántos arranques distintos probar. Más = más parejo y más lento. */
  intentos?: number;
}

export interface ResultadoSorteo {
  /** Cada equipo, con sus jugadores ordenados de mayor a menor nivel. */
  equipos: JugadorId[][];
  semilla: number;
  /** Suma de niveles de cada equipo. */
  fuerza: number[];
  /** Nivel promedio de cada equipo. */
  promedio: number[];
  /** Distancia entre el promedio del equipo más fuerte y el del más flojo. */
  diferencia: number;
  arquerosPorEquipo: number[];
  reglasRotas: Regla[];
  /** Cuántos repartos igual de parejos había para elegir. */
  variantes: number;
}

const PENAL_REGLA = 1000;
const PENAL_ARQUERO = 400;
const PESO_CRACKS = 0.6;
const PESO_FLOJOS = 0.3;
/** Dos repartos que difieren menos que esto en nivel se consideran igual de parejos. */
const TOLERANCIA = 0.5;

export function semillaAlAzar(): number {
  return Math.floor(Math.random() * 0xffffffff) >>> 0;
}

/** Generador pseudoaleatorio con semilla: el mismo número devuelve siempre el mismo sorteo. */
function generador(semilla: number): () => number {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function mezclar<T>(lista: T[], azar: () => number): T[] {
  const copia = lista.slice();
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/** Reparte n jugadores en t equipos lo más parejo que se pueda: algunos de 6 y otros de 5. */
export function tamanosDeEquipo(jugadores: number, equipos: number): number[] {
  const base = Math.floor(jugadores / equipos);
  const resto = jugadores % equipos;
  return Array.from({ length: equipos }, (_, i) => (i < resto ? base + 1 : base));
}

interface Estado {
  /** Para cada jugador (por índice), en qué equipo está. */
  equipoDe: Int32Array;
  sumas: Float64Array;
  tamanos: Int32Array;
  cracks: Int32Array;
  flojos: Int32Array;
  arqueros: Int32Array;
}

export function sortearEquipos(opciones: OpcionesSorteo): ResultadoSorteo {
  const {
    jugadores,
    equipos: cantEquipos,
    reglas = [],
    fijados = {},
    repartirArqueros = true,
    intentos,
  } = opciones;

  if (cantEquipos < 2) {
    throw new Error('Hacen falta al menos 2 equipos.');
  }
  if (jugadores.length < cantEquipos) {
    throw new Error(`Con ${jugadores.length} anotados no se pueden armar ${cantEquipos} equipos.`);
  }

  const semilla = opciones.semilla ?? semillaAlAzar();
  const azar = generador(semilla);

  const n = jugadores.length;
  const indiceDe = new Map<JugadorId, number>();
  jugadores.forEach((j, i) => indiceDe.set(j.id, i));

  const niveles = Float64Array.from(jugadores.map((j) => j.nivel));
  const esArquero = jugadores.map((j) => j.arquero);
  const total = niveles.reduce((a, b) => a + b, 0);
  const media = total / n;

  // Cracks y flojos: el tercio de arriba y el de abajo de la tabla. Que las sumas
  // empaten no alcanza — cuatro jugadores de 5 no son lo mismo que un 9 y tres de 3.
  const porNivel = jugadores.map((_, i) => i).sort((a, b) => niveles[b] - niveles[a]);
  const corte = Math.max(1, Math.round(n / 3));
  const esCrack = new Uint8Array(n);
  const esFlojo = new Uint8Array(n);
  porNivel.slice(0, corte).forEach((i) => (esCrack[i] = 1));
  porNivel.slice(-corte).forEach((i) => (esFlojo[i] = 1));

  const reglasIndexadas = reglas
    .map((r) => ({ regla: r, a: indiceDe.get(r.a), b: indiceDe.get(r.b) }))
    .filter((r): r is { regla: Regla; a: number; b: number } => r.a !== undefined && r.b !== undefined);

  const cantArqueros = esArquero.filter(Boolean).length;
  const arquerosMax = repartirArqueros ? Math.ceil(cantArqueros / cantEquipos) : n;
  const arquerosMin = repartirArqueros ? Math.floor(cantArqueros / cantEquipos) : 0;

  const clavados = new Int32Array(n).fill(-1);
  for (const [id, equipo] of Object.entries(fijados)) {
    const i = indiceDe.get(id);
    if (i !== undefined && equipo >= 0 && equipo < cantEquipos) clavados[i] = equipo;
  }
  const hayClavados = clavados.some((e) => e >= 0);

  const evaluar = (e: Estado): { duro: number; blando: number } => {
    let maxDesvio = -Infinity;
    let minDesvio = Infinity;
    let maxCracks = -Infinity;
    let minCracks = Infinity;
    let maxFlojos = -Infinity;
    let minFlojos = Infinity;
    let duro = 0;

    for (let t = 0; t < cantEquipos; t++) {
      // Contra la media: así un equipo de 6 no parece más fuerte que uno de 5 sólo por ser más.
      const desvio = e.sumas[t] - e.tamanos[t] * media;
      if (desvio > maxDesvio) maxDesvio = desvio;
      if (desvio < minDesvio) minDesvio = desvio;
      if (e.cracks[t] > maxCracks) maxCracks = e.cracks[t];
      if (e.cracks[t] < minCracks) minCracks = e.cracks[t];
      if (e.flojos[t] > maxFlojos) maxFlojos = e.flojos[t];
      if (e.flojos[t] < minFlojos) minFlojos = e.flojos[t];
      if (repartirArqueros) {
        if (e.arqueros[t] > arquerosMax) duro += PENAL_ARQUERO * (e.arqueros[t] - arquerosMax);
        if (e.arqueros[t] < arquerosMin) duro += PENAL_ARQUERO * (arquerosMin - e.arqueros[t]);
      }
    }

    for (const { regla, a, b } of reglasIndexadas) {
      const mismoEquipo = e.equipoDe[a] === e.equipoDe[b];
      if (regla.tipo === 'juntos' ? !mismoEquipo : mismoEquipo) duro += PENAL_REGLA;
    }

    const blando =
      maxDesvio - minDesvio + PESO_CRACKS * (maxCracks - minCracks) + PESO_FLOJOS * (maxFlojos - minFlojos);

    return { duro, blando };
  };

  const armarEstado = (asignacion: Int32Array): Estado => {
    const e: Estado = {
      equipoDe: asignacion,
      sumas: new Float64Array(cantEquipos),
      tamanos: new Int32Array(cantEquipos),
      cracks: new Int32Array(cantEquipos),
      flojos: new Int32Array(cantEquipos),
      arqueros: new Int32Array(cantEquipos),
    };
    for (let i = 0; i < n; i++) {
      const t = asignacion[i];
      e.sumas[t] += niveles[i];
      e.tamanos[t]++;
      if (esCrack[i]) e.cracks[t]++;
      if (esFlojo[i]) e.flojos[t]++;
      if (esArquero[i]) e.arqueros[t]++;
    }
    return e;
  };

  const mover = (e: Estado, i: number, desde: number, hacia: number) => {
    e.equipoDe[i] = hacia;
    e.sumas[desde] -= niveles[i];
    e.sumas[hacia] += niveles[i];
    e.tamanos[desde]--;
    e.tamanos[hacia]++;
    if (esCrack[i]) {
      e.cracks[desde]--;
      e.cracks[hacia]++;
    }
    if (esFlojo[i]) {
      e.flojos[desde]--;
      e.flojos[hacia]++;
    }
    if (esArquero[i]) {
      e.arqueros[desde]--;
      e.arqueros[hacia]++;
    }
  };

  /** Reparte los cupos de cada equipo, dándole los lugares de más a quien ya tiene clavados. */
  const repartirCupos = (): number[] => {
    const cupos = tamanosDeEquipo(n, cantEquipos);
    const orden = mezclar(
      Array.from({ length: cantEquipos }, (_, t) => t),
      azar,
    );
    if (hayClavados) {
      const porClavados = new Int32Array(cantEquipos);
      for (let i = 0; i < n; i++) if (clavados[i] >= 0) porClavados[clavados[i]]++;
      orden.sort((a, b) => porClavados[b] - porClavados[a]);
      const asignados: number[] = new Array(cantEquipos);
      orden.forEach((equipo, pos) => (asignados[equipo] = cupos[pos]));
      for (let t = 0; t < cantEquipos; t++) {
        if (porClavados[t] > asignados[t]) {
          throw new Error(
            `Clavaste ${porClavados[t]} jugadores en un equipo que sólo entra ${asignados[t]}.`,
          );
        }
      }
      return asignados;
    }
    const asignados: number[] = new Array(cantEquipos);
    orden.forEach((equipo, pos) => (asignados[equipo] = cupos[pos]));
    return asignados;
  };

  /** Arranque: o bien draft en serpentina sobre el orden de nivel, o bien puro azar. */
  const arranque = (cupos: number[], serpentina: boolean): Int32Array => {
    const asignacion = new Int32Array(n).fill(-1);
    const libres = cupos.slice();

    for (let i = 0; i < n; i++) {
      if (clavados[i] >= 0) {
        asignacion[i] = clavados[i];
        libres[clavados[i]]--;
      }
    }

    const pendientes = jugadores
      .map((_, i) => i)
      .filter((i) => asignacion[i] < 0)
      // Desempate al azar entre iguales: dos jugadores de 7 no siempre caen en el mismo lado.
      .map((i) => ({ i, orden: serpentina ? niveles[i] + azar() * 0.001 : azar() }))
      .sort((a, b) => b.orden - a.orden)
      .map((x) => x.i);

    let dir = 1;
    let t = 0;
    for (const i of pendientes) {
      let vueltas = 0;
      while (libres[t] <= 0) {
        t += dir;
        if (t >= cantEquipos) {
          t = cantEquipos - 1;
          dir = -1;
        } else if (t < 0) {
          t = 0;
          dir = 1;
        }
        if (++vueltas > cantEquipos * 4) break;
      }
      asignacion[i] = t;
      libres[t]--;
      t += dir;
      if (t >= cantEquipos) {
        t = cantEquipos - 1;
        dir = -1;
      } else if (t < 0) {
        t = 0;
        dir = 1;
      }
    }
    return asignacion;
  };

  /** Intercambia pares entre equipos mientras eso mejore el reparto. */
  const mejorar = (e: Estado) => {
    const movibles = jugadores.map((_, i) => i).filter((i) => clavados[i] < 0);
    let actual = evaluar(e);

    for (let pasada = 0; pasada < 60; pasada++) {
      let mejoro = false;
      const orden = mezclar(movibles, azar);

      for (let x = 0; x < orden.length; x++) {
        for (let y = x + 1; y < orden.length; y++) {
          const i = orden[x];
          const j = orden[y];
          const ti = e.equipoDe[i];
          const tj = e.equipoDe[j];
          if (ti === tj) continue;

          mover(e, i, ti, tj);
          mover(e, j, tj, ti);
          const nuevo = evaluar(e);

          const mejor =
            nuevo.duro < actual.duro ||
            (nuevo.duro === actual.duro && nuevo.blando < actual.blando - 1e-9);

          if (mejor) {
            actual = nuevo;
            mejoro = true;
          } else {
            mover(e, i, tj, ti);
            mover(e, j, ti, tj);
          }
        }
      }
      if (!mejoro) break;
    }
    return actual;
  };

  const arranques = intentos ?? (n <= 14 ? 60 : n <= 24 ? 40 : 24);
  const encontrados = new Map<string, { asignacion: Int32Array; duro: number; blando: number }>();

  for (let intento = 0; intento < arranques; intento++) {
    const cupos = repartirCupos();
    const estado = armarEstado(arranque(cupos, intento % 3 !== 0));
    const puntaje = mejorar(estado);

    const firma = firmar(estado.equipoDe, cantEquipos);
    const previo = encontrados.get(firma);
    if (!previo || puntaje.blando < previo.blando) {
      encontrados.set(firma, {
        asignacion: Int32Array.from(estado.equipoDe),
        duro: puntaje.duro,
        blando: puntaje.blando,
      });
    }
  }

  const todos = [...encontrados.values()];
  const mejorDuro = Math.min(...todos.map((s) => s.duro));
  const candidatosDuros = todos.filter((s) => s.duro === mejorDuro);
  const mejorBlando = Math.min(...candidatosDuros.map((s) => s.blando));
  // De acá sale la gracia: todos estos repartos son igual de parejos, así que elegimos uno al azar.
  const empatados = candidatosDuros.filter((s) => s.blando <= mejorBlando + TOLERANCIA);
  const elegido = empatados[Math.floor(azar() * empatados.length)];

  return construirResultado(elegido.asignacion, {
    jugadores,
    cantEquipos,
    niveles,
    esArquero,
    reglasIndexadas,
    semilla,
    variantes: empatados.length,
  });
}

function firmar(asignacion: Int32Array, cantEquipos: number): string {
  const grupos: number[][] = Array.from({ length: cantEquipos }, () => []);
  for (let i = 0; i < asignacion.length; i++) grupos[asignacion[i]].push(i);
  return grupos
    .map((g) => g.join('.'))
    .sort()
    .join('|');
}

function construirResultado(
  asignacion: Int32Array,
  ctx: {
    jugadores: JugadorSorteo[];
    cantEquipos: number;
    niveles: Float64Array;
    esArquero: boolean[];
    reglasIndexadas: { regla: Regla; a: number; b: number }[];
    semilla: number;
    variantes: number;
  },
): ResultadoSorteo {
  const { jugadores, cantEquipos, niveles, esArquero, reglasIndexadas, semilla, variantes } = ctx;
  const porEquipo: number[][] = Array.from({ length: cantEquipos }, () => []);
  for (let i = 0; i < asignacion.length; i++) porEquipo[asignacion[i]].push(i);

  const fuerza = porEquipo.map((g) => g.reduce((s, i) => s + niveles[i], 0));
  const promedio = porEquipo.map((g, t) => (g.length ? fuerza[t] / g.length : 0));
  const arquerosPorEquipo = porEquipo.map((g) => g.filter((i) => esArquero[i]).length);

  const reglasRotas = reglasIndexadas
    .filter(({ regla, a, b }) => {
      const juntos = asignacion[a] === asignacion[b];
      return regla.tipo === 'juntos' ? !juntos : juntos;
    })
    .map((r) => r.regla);

  const equipos = porEquipo.map((g) =>
    g
      // El arquero primero, después de mayor a menor nivel: se lee como una formación.
      .sort((a, b) => {
        if (esArquero[a] !== esArquero[b]) return esArquero[a] ? -1 : 1;
        return niveles[b] - niveles[a];
      })
      .map((i) => jugadores[i].id),
  );

  return {
    equipos,
    semilla,
    fuerza,
    promedio,
    diferencia: Math.max(...promedio) - Math.min(...promedio),
    arquerosPorEquipo,
    reglasRotas,
    variantes,
  };
}
