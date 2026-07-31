import { describe, it, expect } from 'vitest';
import { sortearEquipos, tamanosDeEquipo, type JugadorSorteo } from './armar';
import type { Regla } from './tipos';

function plantel(niveles: number[], arqueros: number[] = []): JugadorSorteo[] {
  return niveles.map((nivel, i) => ({
    id: `j${i}`,
    nivel,
    arquero: arqueros.includes(i),
  }));
}

const PLANTEL_REAL = plantel([9, 8, 8, 7, 7, 6, 6, 6, 5, 5, 4, 4, 3, 2], [0, 8]);

describe('tamanosDeEquipo', () => {
  it('reparte parejo cuando divide justo', () => {
    expect(tamanosDeEquipo(10, 2)).toEqual([5, 5]);
    expect(tamanosDeEquipo(21, 3)).toEqual([7, 7, 7]);
  });

  it('deja los equipos con un jugador de diferencia como mucho', () => {
    expect(tamanosDeEquipo(11, 2)).toEqual([6, 5]);
    expect(tamanosDeEquipo(14, 4)).toEqual([4, 4, 3, 3]);
  });
});

describe('sortearEquipos', () => {
  it('reparte a todos los anotados sin repetir ni perder a nadie', () => {
    const jugadores = plantel([5, 5, 5, 5, 5, 5, 5, 5, 5, 5]);
    const { equipos } = sortearEquipos({ jugadores, equipos: 2, semilla: 1 });

    const repartidos = equipos.flat();
    expect(repartidos).toHaveLength(10);
    expect(new Set(repartidos).size).toBe(10);
    expect(equipos.map((e) => e.length)).toEqual([5, 5]);
  });

  it('con impares deja equipos de 6 y 5, no uno de 8', () => {
    const { equipos } = sortearEquipos({ jugadores: plantel(Array(11).fill(5)), equipos: 2, semilla: 7 });
    expect(equipos.map((e) => e.length).sort()).toEqual([5, 6]);
  });

  it('arma tres equipos cuando se lo pedís', () => {
    const { equipos } = sortearEquipos({ jugadores: PLANTEL_REAL, equipos: 3, semilla: 42 });
    expect(equipos).toHaveLength(3);
    expect(equipos.flat()).toHaveLength(14);
    expect(equipos.map((e) => e.length).sort()).toEqual([4, 5, 5]);
  });

  it('encuentra el reparto perfecto cuando existe', () => {
    const { diferencia, fuerza } = sortearEquipos({
      jugadores: plantel([10, 10, 1, 1]),
      equipos: 2,
      semilla: 3,
    });
    expect(fuerza).toEqual([11, 11]);
    expect(diferencia).toBe(0);
  });

  it('deja los equipos parejos con un plantel de verdad, tire la semilla que tire', () => {
    for (let semilla = 0; semilla < 30; semilla++) {
      const { diferencia } = sortearEquipos({ jugadores: PLANTEL_REAL, equipos: 2, semilla });
      // Menos de medio punto de nivel promedio de diferencia entre los dos equipos.
      expect(diferencia).toBeLessThan(0.5);
    }
  });

  it('no amontona a los cracks de un lado aunque las sumas empaten', () => {
    // Un 10 + cuatro 1 suma lo mismo que cinco 2.8, pero no es el mismo partido.
    const jugadores = plantel([10, 10, 6, 6, 2, 2, 1, 1]);
    for (let semilla = 0; semilla < 20; semilla++) {
      const { equipos } = sortearEquipos({ jugadores, equipos: 2, semilla });
      const dieces = equipos.map((e) => e.filter((id) => ['j0', 'j1'].includes(id)).length);
      expect(dieces).toEqual([1, 1]);
    }
  });

  it('reparte un arquero por equipo', () => {
    for (let semilla = 0; semilla < 20; semilla++) {
      const { arquerosPorEquipo } = sortearEquipos({ jugadores: PLANTEL_REAL, equipos: 2, semilla });
      expect(arquerosPorEquipo).toEqual([1, 1]);
    }
  });

  it('no junta arqueros ni cuando sobran', () => {
    const jugadores = plantel([6, 6, 5, 5, 5, 5, 4, 4], [0, 1, 2]);
    for (let semilla = 0; semilla < 20; semilla++) {
      const { arquerosPorEquipo } = sortearEquipos({ jugadores, equipos: 2, semilla });
      expect(Math.max(...arquerosPorEquipo)).toBeLessThanOrEqual(2);
      expect(Math.min(...arquerosPorEquipo)).toBeGreaterThanOrEqual(1);
    }
  });

  it('respeta "estos dos nunca juntos"', () => {
    const reglas: Regla[] = [{ id: 'r1', tipo: 'separados', a: 'j0', b: 'j1' }];
    for (let semilla = 0; semilla < 20; semilla++) {
      const { equipos, reglasRotas } = sortearEquipos({
        jugadores: PLANTEL_REAL,
        equipos: 2,
        reglas,
        semilla,
      });
      const equipoDe = (id: string) => equipos.findIndex((e) => e.includes(id));
      expect(equipoDe('j0')).not.toBe(equipoDe('j1'));
      expect(reglasRotas).toHaveLength(0);
    }
  });

  it('respeta "estos dos siempre juntos"', () => {
    const reglas: Regla[] = [{ id: 'r1', tipo: 'juntos', a: 'j0', b: 'j13' }];
    for (let semilla = 0; semilla < 20; semilla++) {
      const { equipos, reglasRotas } = sortearEquipos({
        jugadores: PLANTEL_REAL,
        equipos: 2,
        reglas,
        semilla,
      });
      const equipoDe = (id: string) => equipos.findIndex((e) => e.includes(id));
      expect(equipoDe('j0')).toBe(equipoDe('j13'));
      expect(reglasRotas).toHaveLength(0);
    }
  });

  it('deja clavados a los jugadores que fijaste', () => {
    for (let semilla = 0; semilla < 15; semilla++) {
      const { equipos } = sortearEquipos({
        jugadores: PLANTEL_REAL,
        equipos: 2,
        fijados: { j3: 0, j4: 1 },
        semilla,
      });
      expect(equipos[0]).toContain('j3');
      expect(equipos[1]).toContain('j4');
    }
  });

  it('con la misma semilla devuelve exactamente el mismo sorteo', () => {
    const a = sortearEquipos({ jugadores: PLANTEL_REAL, equipos: 2, semilla: 12345 });
    const b = sortearEquipos({ jugadores: PLANTEL_REAL, equipos: 2, semilla: 12345 });
    expect(b.equipos).toEqual(a.equipos);
    expect(b.fuerza).toEqual(a.fuerza);
  });

  it('con semillas distintas no repite siempre los mismos equipos', () => {
    const vistos = new Set<string>();
    for (let semilla = 0; semilla < 25; semilla++) {
      const { equipos } = sortearEquipos({ jugadores: PLANTEL_REAL, equipos: 2, semilla });
      vistos.add(
        equipos
          .map((e) => [...e].sort().join(','))
          .sort()
          .join('|'),
      );
    }
    expect(vistos.size).toBeGreaterThan(3);
  });

  it('avisa cuando no alcanzan los jugadores', () => {
    expect(() => sortearEquipos({ jugadores: plantel([5]), equipos: 2 })).toThrow(/no se pueden armar/);
  });

  it('avisa cuando le pedís menos de dos equipos', () => {
    expect(() => sortearEquipos({ jugadores: plantel([5, 5]), equipos: 1 })).toThrow(/al menos 2/);
  });

  it('aguanta un plantel grande repartido en cuatro equipos', () => {
    const jugadores = plantel(Array.from({ length: 32 }, (_, i) => 1 + (i % 10)));
    const { equipos, diferencia } = sortearEquipos({ jugadores, equipos: 4, semilla: 99 });
    expect(equipos.map((e) => e.length)).toEqual([8, 8, 8, 8]);
    expect(diferencia).toBeLessThan(0.5);
  });
});
