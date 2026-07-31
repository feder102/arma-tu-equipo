import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useContextoGrupo } from './MarcoGrupo';
import { FilaJugador } from '../componentes/FilaJugador';
import { Nivel, Resumen, Seccion, formatearNivel, useCopiar } from '../componentes/Piezas';
import { jugadorNuevo, normalizarNombre } from '../lib/almacen';
import { enlaceDeGrupo } from '../lib/compartir';
import { nuevoId } from '../lib/id';
import type { Jugador, TipoRegla } from '../lib/tipos';

export default function Plantel() {
  const { grupo, editar } = useContextoGrupo();
  const [nombre, setNombre] = useState('');
  const [nivel, setNivel] = useState(5);
  const [arquero, setArquero] = useState(false);
  const [repetido, setRepetido] = useState('');
  const campoNombre = useRef<HTMLInputElement>(null);

  const activos = useMemo(() => grupo.jugadores.filter((j) => j.activo), [grupo.jugadores]);
  const promedio = activos.length ? activos.reduce((s, j) => s + j.nivel, 0) / activos.length : 0;
  const arqueros = activos.filter((j) => j.arquero).length;

  function anotar(evento: React.FormEvent) {
    evento.preventDefault();
    const limpio = nombre.trim();
    if (!limpio) return;

    const yaEsta = grupo.jugadores.some((j) => normalizarNombre(j.nombre) === normalizarNombre(limpio));
    if (yaEsta) {
      setRepetido(`${limpio} ya está en el plantel.`);
      return;
    }

    const jugador = jugadorNuevo(limpio, nivel, arquero);
    editar((g) => ({ ...g, jugadores: [...g.jugadores, jugador] }));
    setNombre('');
    setArquero(false);
    setRepetido('');
    campoNombre.current?.focus();
  }

  function cambiarJugador(id: string, cambios: Partial<Jugador>) {
    editar((g) => ({
      ...g,
      jugadores: g.jugadores.map((j) => (j.id === id ? { ...j, ...cambios } : j)),
    }));
  }

  function borrarJugador(id: string) {
    editar((g) => ({
      ...g,
      jugadores: g.jugadores.filter((j) => j.id !== id),
      reglas: g.reglas.filter((r) => r.a !== id && r.b !== id),
    }));
  }

  return (
    <>
      <Resumen
        campos={[
          { rotulo: 'En el plantel', valor: activos.length },
          { rotulo: 'Nivel promedio', valor: activos.length ? formatearNivel(promedio) : '—' },
          { rotulo: arqueros === 1 ? 'Arquero' : 'Arqueros', valor: arqueros },
        ]}
      />

      {grupo.jugadores.length === 0 ? (
        <p className="vacio">
          La planilla está en blanco. Escribí el primer nombre acá abajo y marcale el nivel: 1 es el que
          va por el asado, 10 es el que resuelve el partido solo.
        </p>
      ) : (
        <ul className="plantel-lista" aria-label="Jugadores del grupo">
          {grupo.jugadores.map((jugador, i) => (
            <FilaJugador
              key={jugador.id}
              jugador={jugador}
              numero={i + 1}
              onCambiar={(cambios) => cambiarJugador(jugador.id, cambios)}
              onBorrar={() => borrarJugador(jugador.id)}
            />
          ))}
        </ul>
      )}

      <Seccion titulo="Sumar al plantel">
        <form className="alta" onSubmit={anotar}>
          <label className="campo">
            <span className="campo__rotulo etiqueta">Nombre</span>
            <input
              ref={campoNombre}
              className="campo__entrada"
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                setRepetido('');
              }}
              placeholder="Nombre y apodo"
              maxLength={30}
              required
            />
          </label>

          <button type="submit" className="boton boton--principal">
            Anotar
          </button>

          <div className="alta__nivel">
            <span className="etiqueta">Nivel</span>
            <Nivel valor={nivel} nombre="el jugador nuevo" onCambio={setNivel} />
            <button
              type="button"
              className="insignia"
              aria-pressed={arquero}
              onClick={() => setArquero(!arquero)}
            >
              Ataja
            </button>
          </div>

          {repetido && <p className="aviso alta__aviso">{repetido}</p>}
        </form>

        {activos.length >= 2 && (
          <div className="botonera botonera--separada">
            <Link to={`/g/${grupo.id}/armar`} className="boton boton--principal">
              Ir a sortear
            </Link>
          </div>
        )}
      </Seccion>

      <Reglas />
      <Compartir />
    </>
  );
}

function Reglas() {
  const { grupo, editar } = useContextoGrupo();
  const [tipo, setTipo] = useState<TipoRegla>('separados');
  const [a, setA] = useState('');
  const [b, setB] = useState('');

  const nombreDe = (id: string) => grupo.jugadores.find((j) => j.id === id)?.nombre ?? '—';

  function agregar(evento: React.FormEvent) {
    evento.preventDefault();
    if (!a || !b || a === b) return;
    const repetida = grupo.reglas.some(
      (r) => (r.a === a && r.b === b) || (r.a === b && r.b === a),
    );
    if (repetida) return;
    editar((g) => ({ ...g, reglas: [...g.reglas, { id: nuevoId(), tipo, a, b }] }));
    setA('');
    setB('');
  }

  if (grupo.jugadores.length < 2) return null;

  return (
    <Seccion titulo="Reglas de la casa" cuenta={grupo.reglas.length > 0 ? `${grupo.reglas.length}` : undefined}>
      <p className="nota nota--arriba">
        Los hermanos que no pueden ir juntos, la pareja que siempre juega del mismo lado. El sorteo las
        respeta antes que nada.
      </p>

      {grupo.reglas.length > 0 && (
        <ul>
          {grupo.reglas.map((regla) => (
            <li key={regla.id} className="regla">
              <span className="regla__tipo">{regla.tipo === 'juntos' ? 'Juntos' : 'Separados'}</span>
              <span className="regla__quienes">
                {nombreDe(regla.a)} y {nombreDe(regla.b)}
              </span>
              <button
                type="button"
                className="boton boton--pelado"
                onClick={() => editar((g) => ({ ...g, reglas: g.reglas.filter((r) => r.id !== regla.id) }))}
                aria-label={`Quitar la regla entre ${nombreDe(regla.a)} y ${nombreDe(regla.b)}`}
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}

      <form className="regla-alta" onSubmit={agregar}>
        <div className="opciones">
          <button
            type="button"
            className="opcion"
            aria-pressed={tipo === 'separados'}
            onClick={() => setTipo('separados')}
          >
            Nunca juntos
          </button>
          <button
            type="button"
            className="opcion"
            aria-pressed={tipo === 'juntos'}
            onClick={() => setTipo('juntos')}
          >
            Siempre juntos
          </button>
        </div>

        <div className="regla-alta__pares">
          <label className="campo">
            <span className="campo__rotulo etiqueta">Jugador</span>
            <select className="selector" value={a} onChange={(e) => setA(e.target.value)} required>
              <option value="">Elegir…</option>
              {grupo.jugadores.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="campo">
            <span className="campo__rotulo etiqueta">Con</span>
            <select className="selector" value={b} onChange={(e) => setB(e.target.value)} required>
              <option value="">Elegir…</option>
              {grupo.jugadores
                .filter((j) => j.id !== a)
                .map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.nombre}
                  </option>
                ))}
            </select>
          </label>

          <button type="submit" className="boton boton--chico" disabled={!a || !b}>
            Agregar regla
          </button>
        </div>
      </form>
    </Seccion>
  );
}

function Compartir() {
  const { grupo } = useContextoGrupo();
  const [abierto, setAbierto] = useState(false);
  const [copiado, copiar] = useCopiar();

  const enlace = useMemo(() => (abierto ? enlaceDeGrupo(grupo) : ''), [abierto, grupo]);
  const mensaje = `Plantel de ${grupo.nombre} para armar los equipos:\n${enlace}`;

  return (
    <Seccion titulo="Pasarle la planilla a alguien">
      {!abierto ? (
        <>
          <p className="nota nota--arriba">
            Se arma un link con el plantel adentro. El que lo abra se lleva una copia a su teléfono.
          </p>
          <button type="button" className="boton" onClick={() => setAbierto(true)}>
            Armar el link
          </button>
        </>
      ) : (
        <>
          <div className="enlace-copiable">{enlace}</div>
          <div className="botonera botonera--separada">
            <button type="button" className="boton boton--principal" onClick={() => copiar(enlace)}>
              {copiado ? 'Copiado' : 'Copiar link'}
            </button>
            <a
              className="boton"
              href={`https://wa.me/?text=${encodeURIComponent(mensaje)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Abrir WhatsApp
            </a>
          </div>
          <p className="nota">
            Es una foto del plantel, no una conexión en vivo: si después sumás gente, hay que volver a
            pasar el link. El historial de partidos no viaja, se queda en este teléfono.
          </p>
        </>
      )}
    </Seccion>
  );
}
