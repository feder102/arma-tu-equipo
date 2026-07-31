import { describe, it, expect } from 'vitest';
import {
  codificarGrupo,
  codificarSorteo,
  decodificarGrupo,
  decodificarSorteo,
  payloadDelHash,
  payloadSorteoDelHash,
} from './compartir';
import { grupoNuevo, jugadorNuevo } from './almacen';
import { nuevoId } from './id';
import type { Grupo, Partido } from './tipos';

function grupoDePrueba(): Grupo {
  const grupo = grupoNuevo('Los martes en el Nacional', 7);
  grupo.jugadores = [
    jugadorNuevo('Nacho', 6, true),
    jugadorNuevo('El Tano', 8),
    jugadorNuevo('Iñaki Pérez', 4),
  ];
  grupo.jugadores[2].activo = false;
  grupo.reglas = [
    { id: nuevoId(), tipo: 'separados', a: grupo.jugadores[0].id, b: grupo.jugadores[1].id },
  ];
  grupo.partidos = [
    {
      id: nuevoId(),
      fecha: new Date().toISOString(),
      semilla: 42,
      equipos: [{ pechera: 'naranja', jugadores: [grupo.jugadores[0].id], goles: 3 }],
      nota: '',
    },
  ];
  return grupo;
}

describe('compartir', () => {
  it('lleva y trae el plantel entero', () => {
    const original = grupoDePrueba();
    const vuelto = decodificarGrupo(codificarGrupo(original));

    expect(vuelto).not.toBeNull();
    expect(vuelto!.id).toBe(original.id);
    expect(vuelto!.nombre).toBe(original.nombre);
    expect(vuelto!.cancha).toBe(7);
    expect(vuelto!.jugadores.map((j) => j.nombre)).toEqual(['Nacho', 'El Tano', 'Iñaki Pérez']);
    expect(vuelto!.jugadores.map((j) => j.nivel)).toEqual([6, 8, 4]);
    expect(vuelto!.jugadores[0].arquero).toBe(true);
    expect(vuelto!.jugadores[1].arquero).toBe(false);
    expect(vuelto!.jugadores[2].activo).toBe(false);
  });

  it('mantiene las reglas apuntando a los jugadores correctos', () => {
    const original = grupoDePrueba();
    const vuelto = decodificarGrupo(codificarGrupo(original))!;

    expect(vuelto.reglas).toHaveLength(1);
    expect(vuelto.reglas[0].tipo).toBe('separados');
    const nombreDe = (id: string) => vuelto.jugadores.find((j) => j.id === id)?.nombre;
    expect([nombreDe(vuelto.reglas[0].a), nombreDe(vuelto.reglas[0].b)]).toEqual(['Nacho', 'El Tano']);
  });

  it('no manda el historial de partidos en el link', () => {
    const vuelto = decodificarGrupo(codificarGrupo(grupoDePrueba()))!;
    expect(vuelto.partidos).toEqual([]);
    expect(vuelto.sorteoActual).toBeNull();
  });

  it('le da ids nuevos a los jugadores importados', () => {
    const original = grupoDePrueba();
    const vuelto = decodificarGrupo(codificarGrupo(original))!;
    const viejos = new Set(original.jugadores.map((j) => j.id));
    expect(vuelto.jugadores.every((j) => !viejos.has(j.id))).toBe(true);
  });

  it('aguanta un plantel grande sin pasarse de largo con la URL', () => {
    const grupo = grupoNuevo('Fútbol del barrio', 11);
    grupo.jugadores = Array.from({ length: 40 }, (_, i) => jugadorNuevo(`Jugador ${i + 1}`, (i % 10) + 1));
    const payload = codificarGrupo(grupo);

    expect(payload.length).toBeLessThan(2000);
    expect(decodificarGrupo(payload)!.jugadores).toHaveLength(40);
  });

  it('devuelve null cuando el link viene cortado o es cualquier cosa', () => {
    expect(decodificarGrupo('')).toBeNull();
    expect(decodificarGrupo('no-es-un-payload')).toBeNull();
    expect(decodificarGrupo(codificarGrupo(grupoDePrueba()).slice(0, 12))).toBeNull();
  });

  it('saca el payload del fragmento de la URL', () => {
    expect(payloadDelHash('#g=ABC123')).toBe('ABC123');
    expect(payloadDelHash('g=ABC123')).toBe('ABC123');
    expect(payloadDelHash('#otracosa=1')).toBeNull();
    expect(payloadDelHash('')).toBeNull();
  });
});

// ─── Compartir sorteo (el link que va por WhatsApp con los equipos armados) ───

function sorteoDePrueba(grupo: Grupo): Partido {
  const [nacho, tano, inaki] = grupo.jugadores;
  return {
    id: nuevoId(),
    fecha: '2026-07-31T20:00:00.000Z',
    semilla: 42,
    equipos: [
      { pechera: 'naranja', jugadores: [nacho.id, tano.id], goles: null },
      { pechera: 'negra', jugadores: [inaki.id], goles: null },
    ],
    nota: '',
  };
}

describe('compartir sorteo', () => {
  it('lleva y trae los equipos con nombres, niveles y arqueros', () => {
    const grupo = grupoDePrueba();
    const original = sorteoDePrueba(grupo);

    const vuelto = decodificarSorteo(codificarSorteo(grupo, original));
    expect(vuelto).not.toBeNull();
    expect(vuelto!.nombreGrupo).toBe(grupo.nombre);
    expect(vuelto!.cancha).toBe(grupo.cancha);
    expect(vuelto!.fecha).toBe(original.fecha);
    expect(vuelto!.semilla).toBe(42);

    expect(vuelto!.equipos).toHaveLength(2);
    expect(vuelto!.equipos[0].pechera).toBe('naranja');
    expect(vuelto!.equipos[0].jugadores.map((j) => j.nombre)).toEqual(['Nacho', 'El Tano']);
    expect(vuelto!.equipos[0].jugadores[0].arquero).toBe(true);
    expect(vuelto!.equipos[1].pechera).toBe('negra');
    expect(vuelto!.equipos[1].jugadores[0].nivel).toBe(4);
  });

  it('no manda jugadores que quedaron afuera del sorteo', () => {
    const grupo = grupoDePrueba();
    // Sumo dos más al plantel, pero el sorteo sólo usa los tres originales.
    grupo.jugadores.push(jugadorNuevo('Extra1', 5), jugadorNuevo('Extra2', 7));

    const sorteo = sorteoDePrueba(grupo);
    const vuelto = decodificarSorteo(codificarSorteo(grupo, sorteo))!;
    const nombres = vuelto.equipos.flatMap((e) => e.jugadores.map((j) => j.nombre));

    expect(nombres).not.toContain('Extra1');
    expect(nombres).not.toContain('Extra2');
    expect(nombres).toHaveLength(3);
  });

  it('sobrevive a un plantel grande sin excederse de largo', () => {
    const grupo = grupoNuevo('Fútbol del barrio', 11);
    grupo.jugadores = Array.from({ length: 22 }, (_, i) => jugadorNuevo(`Jugador ${i + 1}`, (i % 10) + 1));
    grupo.jugadores[0].arquero = true;
    grupo.jugadores[11].arquero = true;
    const sorteo: Partido = {
      id: nuevoId(),
      fecha: '2026-07-31T20:00:00.000Z',
      semilla: 1,
      equipos: [
        { pechera: 'naranja', jugadores: grupo.jugadores.slice(0, 11).map((j) => j.id), goles: null },
        { pechera: 'negra', jugadores: grupo.jugadores.slice(11).map((j) => j.id), goles: null },
      ],
      nota: '',
    };
    const payload = codificarSorteo(grupo, sorteo);
    expect(payload.length).toBeLessThan(2000);
    const vuelto = decodificarSorteo(payload)!;
    expect(vuelto.equipos[0].jugadores).toHaveLength(11);
    expect(vuelto.equipos[1].jugadores).toHaveLength(11);
  });

  it('devuelve null cuando el payload viene roto', () => {
    expect(decodificarSorteo('')).toBeNull();
    expect(decodificarSorteo('cualquier-cosa')).toBeNull();
  });

  it('saca el payload del sorteo del fragmento de la URL', () => {
    expect(payloadSorteoDelHash('#s=ABC123')).toBe('ABC123');
    expect(payloadSorteoDelHash('s=ABC123')).toBe('ABC123');
    expect(payloadSorteoDelHash('#g=eso-es-plantel')).toBeNull();
    expect(payloadSorteoDelHash('')).toBeNull();
  });
});
