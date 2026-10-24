import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContextoGrupo } from './MarcoGrupo';
import { Resumen, Seccion, formatearNivel } from '../componentes/Piezas';
import { sortearEquipos, tamanosDeEquipo } from '../lib/armar';
import { pechera } from '../lib/pecheras';
import { nuevoId } from '../lib/id';

export default function Armar() {
  const { grupo, editar } = useContextoGrupo();
  const navegar = useNavigate();

  const disponibles = useMemo(() => grupo.jugadores.filter((j) => j.activo), [grupo.jugadores]);
  const [vienen, setVienen] = useState<Set<string>>(() => new Set(disponibles.map((j) => j.id)));
  const [equipos, setEquipos] = useState(2);
  const [repartirArqueros, setRepartirArqueros] = useState(true);
  const [error, setError] = useState('');

  const anotados = disponibles.filter((j) => vienen.has(j.id));
  const maxEquipos = Math.max(2, Math.min(6, Math.floor(anotados.length / 2)));
  const equiposElegidos = Math.min(equipos, maxEquipos);
  const tamanos = anotados.length >= 2 ? tamanosDeEquipo(anotados.length, equiposElegidos) : [];
  const arqueros = anotados.filter((j) => j.arquero).length;
  const promedio = anotados.length ? anotados.reduce((s, j) => s + j.nivel, 0) / anotados.length : 0;

  function alternar(id: string) {
    setVienen((previos) => {
      const copia = new Set(previos);
      if (copia.has(id)) copia.delete(id);
      else copia.add(id);
      return copia;
    });
  }

  function sortear() {
    try {
      const resultado = sortearEquipos({
        jugadores: anotados.map((j) => ({ id: j.id, nivel: j.nivel, arquero: j.arquero })),
        equipos: equiposElegidos,
        reglas: grupo.reglas.filter((r) => vienen.has(r.a) && vienen.has(r.b)),
        repartirArqueros,
      });

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

      navegar(`/g/${grupo.id}/sorteo`);
    } catch (falla) {
      setError(falla instanceof Error ? falla.message : 'No se pudo sortear.');
    }
  }

  if (disponibles.length < 4) {
    return (
      <Seccion titulo="¿Quién juega hoy?">
        <p className="vacio">
          Con {disponibles.length} {disponibles.length === 1 ? 'jugador' : 'jugadores'} todavía no hay
          partido. Volvé al plantel y sumá gente: desde cuatro ya se puede armar algo.
        </p>
      </Seccion>
    );
  }

  return (
    <>
      <Resumen
        campos={[
          { rotulo: 'Vienen hoy', valor: anotados.length },
          { rotulo: 'Equipos de', valor: tamanos.length ? tamanos.join(' y ') : '—' },
          { rotulo: 'Nivel promedio', valor: anotados.length ? formatearNivel(promedio) : '—' },
        ]}
      />

      <Seccion
        titulo="¿Quién juega hoy?"
        cuenta={
          <span className="botonera botonera--pegada">
            <button
              type="button"
              className="boton boton--pelado"
              onClick={() => setVienen(new Set(disponibles.map((j) => j.id)))}
            >
              Todos
            </button>
            <button type="button" className="boton boton--pelado" onClick={() => setVienen(new Set())}>
              Ninguno
            </button>
          </span>
        }
      >
        <ul>
          {disponibles.map((j) => {
            const viene = vienen.has(j.id);
            return (
              <li key={j.id}>
                <button
                  type="button"
                  className="anotado"
                  aria-pressed={viene}
                  onClick={() => alternar(j.id)}
                >
                  <span className="anotado__casilla" aria-hidden="true">
                    {viene && (
                      <svg viewBox="0 0 16 16">
                        <path d="m3 8.5 3.2 3L13 4.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span className="anotado__nombre">{j.nombre}</span>
                  {/* La celda va siempre, aunque esté vacía, para que las columnas se alineen. */}
                  {j.arquero ? <span className="ficha-arq">ataja</span> : <span />}
                  <span className="anotado__nivel">{j.nivel}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </Seccion>

      <Seccion titulo="Cómo repartimos">
        <fieldset className="campo campo--suelto">
          <legend className="campo__rotulo etiqueta">Cantidad de equipos</legend>
          <div className="opciones">
            {Array.from({ length: maxEquipos - 1 }, (_, i) => i + 2).map((n) => (
              <button
                key={n}
                type="button"
                className="opcion"
                aria-pressed={equiposElegidos === n}
                onClick={() => setEquipos(n)}
              >
                {n} equipos
              </button>
            ))}
          </div>
        </fieldset>

        {tamanos.length > 0 && (
          <p className="nota nota--arriba">
            {new Set(tamanos).size === 1
              ? `${equiposElegidos} equipos de ${tamanos[0]}.`
              : `No divide justo: salen equipos de ${tamanos.join(' y ')}. Si querés parejo, sacá o sumá a alguien.`}
            {grupo.cancha !== tamanos[0] &&
              new Set(tamanos).size === 1 &&
              ` Tu grupo juega fútbol ${grupo.cancha}.`}
          </p>
        )}

        <div className="opciones opciones--sueltas">
          <button
            type="button"
            className="opcion"
            aria-pressed={repartirArqueros}
            onClick={() => setRepartirArqueros(!repartirArqueros)}
          >
            {arqueros > 0
              ? `Repartir los ${arqueros} arqueros`
              : 'Repartir arqueros (no marcaste ninguno)'}
          </button>
        </div>
      </Seccion>

      {error && <p className="aviso">{error}</p>}

      <div className="barra-pie">
        <button
          type="button"
          className="boton boton--principal boton--sorteo"
          onClick={sortear}
          disabled={anotados.length < equiposElegidos * 2}
        >
          Sortear equipos
        </button>
        {anotados.length < equiposElegidos * 2 && (
          <p className="nota">
            Faltan anotados para armar {equiposElegidos} equipos de al menos dos.
          </p>
        )}
      </div>
    </>
  );
}
