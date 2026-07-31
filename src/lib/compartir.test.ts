import { describe, it, expect } from 'vitest';
import { codificarGrupo, decodificarGrupo, payloadDelHash } from './compartir';
import { grupoNuevo, jugadorNuevo } from './almacen';
import { nuevoId } from './id';
import type { Grupo } from './tipos';

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
