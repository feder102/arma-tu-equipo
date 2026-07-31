import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useContextoGrupo } from './MarcoGrupo';
import { Balanza, TarjetaPechera } from '../componentes/Pecheras';
import { Seccion, formatearNivel, useCopiar } from '../componentes/Piezas';
import { sortearEquipos } from '../lib/armar';
import { pechera } from '../lib/pecheras';
import { nuevoId } from '../lib/id';
import type { Jugador } from '../lib/tipos';

export default function Sorteo() {
  const { grupo, editar } = useContextoGrupo();
  const navegar = useNavigate();
  const [fijados, setFijados] = useState<Record<string, number>>({});
  const [error, setError] = useState('');
  const [copiado, copiar] = useCopiar();

  const sorteo = grupo.sorteoActual;
  const porId = useMemo(
    () => new Map(grupo.jugadores.map((j) => [j.id, j])),
    [grupo.jugadores],
  );

  const equipos = useMemo(
    () =>
      (sorteo?.equipos ?? []).map((e) =>
        e.jugadores.map((id) => porId.get(id)).filter((j): j is Jugador => Boolean(j)),
      ),
    [sorteo, porId],
  );

  if (!sorteo) {
    return (
      <Seccion titulo="No hay sorteo abierto">
        <p className="vacio">
          El último sorteo ya se guardó en el historial. Elegí quién juega y tirá uno nuevo.
        </p>
        <Link to={`/g/${grupo.id}/armar`} className="boton boton--principal">
          Elegir quién juega
        </Link>
      </Seccion>
    );
  }

  const fuerzas = equipos.map((e) => e.reduce((s, j) => s + j.nivel, 0));
  const promedios = equipos.map((e, i) => (e.length ? fuerzas[i] / e.length : 0));
  const diferencia = promedios.length ? Math.max(...promedios) - Math.min(...promedios) : 0;

  function fijar(id: string, equipo: number | null) {
    setFijados((previos) => {
      const copia = { ...previos };
      if (equipo === null) delete copia[id];
      else copia[id] = equipo;
      return copia;
    });
  }

  function sortearDeNuevo() {
    const anotados = equipos.flat();
    try {
      const resultado = sortearEquipos({
        jugadores: anotados.map((j) => ({ id: j.id, nivel: j.nivel, arquero: j.arquero })),
        equipos: equipos.length,
        reglas: grupo.reglas.filter((r) => porId.has(r.a) && porId.has(r.b)),
        fijados,
      });

      setError('');
      editar((g) => ({
        ...g,
        sorteoActual: {
          id: nuevoId(),
          fecha: new Date().toISOString(),
          semilla: resultado.semilla,
          equipos: resultado.equipos.map((jugadores, i) => ({
            pechera: pechera(i).id,
            jugadores,
            goles: null,
          })),
          variantes: resultado.variantes,
          nota: '',
        },
      }));
    } catch (falla) {
      setError(falla instanceof Error ? falla.message : 'No se pudo volver a sortear.');
    }
  }

  function guardarEnHistorial() {
    navegar(`/g/${grupo.id}/historial`);
    editar((g) => ({
      ...g,
      partidos: g.sorteoActual ? [g.sorteoActual, ...g.partidos] : g.partidos,
      sorteoActual: null,
    }));
  }

  const textoParaPasar = [
    `${grupo.nombre} — equipos`,
    '',
    ...equipos.flatMap((e, i) => [
      `${pechera(i).nombre.toUpperCase()} (nivel ${formatearNivel(promedios[i])})`,
      ...e.map((j) => `· ${j.nombre}${j.arquero ? ' (arq)' : ''}`),
      '',
    ]),
  ].join('\n');

  const clavados = Object.keys(fijados).length;

  return (
    <>
      <Seccion
        titulo="Así quedaron"
        cuenta={sorteo.variantes ? `1 de ${sorteo.variantes} repartos parejos` : undefined}
      >
        <div className="pecheras">
          {equipos.map((jugadores, i) => (
            <TarjetaPechera
              key={i}
              indice={i}
              jugadores={jugadores}
              promedio={promedios[i]}
              fijados={fijados}
              onFijar={fijar}
            />
          ))}
        </div>

        <Balanza fuerzas={fuerzas} diferencia={diferencia} />

        {error && <p className="aviso">{error}</p>}

        {clavados > 0 && (
          <p className="aviso aviso--tinta">
            {clavados === 1 ? 'Hay 1 jugador fijo' : `Hay ${clavados} jugadores fijos`}: al volver a
            sortear {clavados === 1 ? 'se queda' : 'se quedan'} donde {clavados === 1 ? 'está' : 'están'}.
          </p>
        )}

        <div className="botonera botonera--separada">
          <button type="button" className="boton boton--principal" onClick={sortearDeNuevo}>
            Sortear de nuevo
          </button>
          <button type="button" className="boton" onClick={() => copiar(textoParaPasar)}>
            {copiado ? 'Copiado' : 'Copiar equipos'}
          </button>
          <a
            className="boton"
            href={`https://wa.me/?text=${encodeURIComponent(textoParaPasar)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Pasar por WhatsApp
          </a>
        </div>

        <p className="nota">
          Tocá <strong>fijo</strong> al lado de un jugador para clavarlo en su equipo y volver a sortear el resto.
          Sirve cuando alguien ya se puso la pechera.
        </p>
      </Seccion>

      <Seccion titulo="Guardar el partido">
        <p className="nota nota--arriba">
          Guardalo en el historial para tener el registro de quién jugó con quién y cargar el resultado
          después.
        </p>
        <div className="botonera">
          <button
            type="button"
            className="boton boton--principal"
            onClick={guardarEnHistorial}
          >
            Guardar en el historial
          </button>
          <Link to={`/g/${grupo.id}/armar`} className="boton">
            Cambiar quién juega
          </Link>
        </div>
      </Seccion>
    </>
  );
}
