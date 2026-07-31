import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Grupo } from '../lib/tipos';
import { grupoNuevo, guardarBase, hayGuardadoPersistente, leerBase, normalizarNombre } from '../lib/almacen';

export type ModoImportacion = 'fusionar' | 'reemplazar' | 'nuevo';

interface Contexto {
  grupos: Grupo[];
  persistente: boolean;
  crear(nombre: string, cancha: number): Grupo;
  obtener(id: string): Grupo | undefined;
  actualizar(id: string, receta: (grupo: Grupo) => Grupo): void;
  borrar(id: string): void;
  importar(entrante: Grupo, modo: ModoImportacion): Grupo;
}

const ContextoGrupos = createContext<Contexto | null>(null);

export function ProveedorGrupos({ children }: { children: ReactNode }) {
  const [grupos, setGrupos] = useState<Grupo[]>(() => leerBase().grupos);
  const persistente = useMemo(() => hayGuardadoPersistente(), []);

  useEffect(() => {
    guardarBase({ version: 1, grupos });
  }, [grupos]);

  const crear = useCallback((nombre: string, cancha: number) => {
    const grupo = grupoNuevo(nombre, cancha);
    setGrupos((previos) => [grupo, ...previos]);
    return grupo;
  }, []);

  const obtener = useCallback((id: string) => grupos.find((g) => g.id === id), [grupos]);

  const actualizar = useCallback((id: string, receta: (grupo: Grupo) => Grupo) => {
    setGrupos((previos) =>
      previos.map((g) => (g.id === id ? { ...receta(g), id: g.id, actualizado: Date.now() } : g)),
    );
  }, []);

  const borrar = useCallback((id: string) => {
    setGrupos((previos) => previos.filter((g) => g.id !== id));
  }, []);

  const importar = useCallback((entrante: Grupo, modo: ModoImportacion) => {
    let resultado = entrante;

    setGrupos((previos) => {
      const existente = previos.find((g) => g.id === entrante.id);

      if (!existente || modo === 'nuevo') {
        resultado = existente ? { ...entrante, id: `${entrante.id}-2` } : entrante;
        return [resultado, ...previos];
      }

      if (modo === 'reemplazar') {
        // El historial es de este teléfono: el link nunca lo trae, así que se conserva.
        resultado = { ...entrante, partidos: existente.partidos, sorteoActual: existente.sorteoActual };
        return previos.map((g) => (g.id === entrante.id ? resultado : g));
      }

      const conocidos = new Set(existente.jugadores.map((j) => normalizarNombre(j.nombre)));
      const sumados = entrante.jugadores.filter((j) => !conocidos.has(normalizarNombre(j.nombre)));
      resultado = {
        ...existente,
        nombre: entrante.nombre || existente.nombre,
        jugadores: [...existente.jugadores, ...sumados],
        actualizado: Date.now(),
      };
      return previos.map((g) => (g.id === entrante.id ? resultado : g));
    });

    return resultado;
  }, []);

  const valor = useMemo<Contexto>(
    () => ({ grupos, persistente, crear, obtener, actualizar, borrar, importar }),
    [grupos, persistente, crear, obtener, actualizar, borrar, importar],
  );

  return <ContextoGrupos.Provider value={valor}>{children}</ContextoGrupos.Provider>;
}

export function useGrupos(): Contexto {
  const contexto = useContext(ContextoGrupos);
  if (!contexto) throw new Error('useGrupos necesita estar dentro de <ProveedorGrupos>.');
  return contexto;
}
