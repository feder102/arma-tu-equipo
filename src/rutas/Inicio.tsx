import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGrupos } from '../estado/grupos';
import { Seccion } from '../componentes/Piezas';
import { payloadDelHash } from '../lib/compartir';

const CANCHAS = [5, 6, 7, 8, 9, 11];

export default function Inicio() {
  const { grupos, crear, persistente } = useGrupos();
  const navegar = useNavigate();

  const [nombre, setNombre] = useState('');
  const [cancha, setCancha] = useState(5);
  const [link, setLink] = useState('');
  const [errorLink, setErrorLink] = useState('');

  function abrirPlanilla(evento: React.FormEvent) {
    evento.preventDefault();
    const grupo = crear(nombre, cancha);
    navegar(`/g/${grupo.id}`);
  }

  function entrarConLink(evento: React.FormEvent) {
    evento.preventDefault();
    const corte = link.indexOf('#');
    const payload = corte >= 0 ? payloadDelHash(link.slice(corte)) : null;
    if (!payload) {
      setErrorLink('Ese link no trae ningún plantel. Pedí que te pasen el link completo, con el # y todo.');
      return;
    }
    setErrorLink('');
    navegar(`/unirse#g=${payload}`);
  }

  return (
    <>
      <header className="tapa margen">
        <h1 className="tapa__titulo display">
          Arma
          <br />
          <span className="tapa__subrayado">tu equipo</span>
        </h1>
        <p className="tapa__bajada">
          Cargá el plantel, ponele un puntaje a cada uno y que el sorteo haga el resto. Equipos parejos,
          sin discusión de vestuario.
        </p>
      </header>

      <div className="margen">
        {grupos.length > 0 && (
          <Seccion titulo="Tus planillas">
            <ul className="planillas">
              {grupos.map((grupo) => (
                <li key={grupo.id}>
                  <Link to={`/g/${grupo.id}`} className="planilla-fila">
                    <span className="planilla-fila__nombre display">{grupo.nombre}</span>
                    <span className="planilla-fila__detalle dato">
                      Fútbol {grupo.cancha}
                      {' · '}
                      {grupo.jugadores.filter((j) => j.activo).length} jugadores
                      {grupo.partidos.length > 0 &&
                        ` · ${grupo.partidos.length} ${grupo.partidos.length === 1 ? 'partido' : 'partidos'}`}
                    </span>
                    <span className="planilla-fila__flecha" aria-hidden="true">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Seccion>
        )}

        <Seccion titulo="Planilla nueva">
          {grupos.length === 0 && (
            <p className="vacio">
              Todavía no hay ninguna planilla. Ponele el nombre con el que se conoce tu fútbol y elegí de
              cuántos juegan. Después cargás a los muchachos.
            </p>
          )}

          <form onSubmit={abrirPlanilla}>
            <label className="campo">
              <span className="campo__rotulo etiqueta">Nombre del grupo</span>
              <input
                className="campo__entrada"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Los martes en el Nacional"
                maxLength={40}
                required
              />
            </label>

            <fieldset className="campo campo--suelto">
              <legend className="campo__rotulo etiqueta">Jugadores por equipo</legend>
              <div className="opciones">
                {CANCHAS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    className="opcion"
                    aria-pressed={cancha === n}
                    onClick={() => setCancha(n)}
                  >
                    Fútbol {n}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="botonera botonera--separada">
              <button type="submit" className="boton boton--principal">
                Abrir la planilla
              </button>
            </div>
          </form>
        </Seccion>

        <Seccion titulo="¿Te pasaron un link?">
          <form onSubmit={entrarConLink}>
            <label className="campo">
              <span className="campo__rotulo etiqueta">Pegá acá el link que te mandaron</span>
              <input
                className="campo__entrada"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://…/unirse#g=…"
                inputMode="url"
                required
              />
            </label>
            {errorLink && <p className="aviso">{errorLink}</p>}
            <div className="botonera botonera--separada">
              <button type="submit" className="boton">
                Ver ese plantel
              </button>
            </div>
          </form>
        </Seccion>

        <Seccion titulo="Cómo funciona">
          <ol className="pasos">
            <li className="pasos__item">
              <span className="pasos__numero display">1</span>
              <div className="pasos__cuerpo">
                <h3 className="pasos__titulo display">Cargás el plantel</h3>
                <p>
                  Escribís los nombres de los que juegan y le ponés a cada uno un puntaje del 1 al 10.
                  Marcá quién ataja: los arqueros se reparten uno por equipo.
                </p>
              </div>
            </li>
            <li className="pasos__item">
              <span className="pasos__numero display">2</span>
              <div className="pasos__cuerpo">
                <h3 className="pasos__titulo display">Tildás quién vino</h3>
                <p>
                  El día del partido marcás los que están y elegís en cuántos equipos repartir. Si son
                  once, salen de seis y de cinco.
                </p>
              </div>
            </li>
            <li className="pasos__item">
              <span className="pasos__numero display">3</span>
              <div className="pasos__cuerpo">
                <h3 className="pasos__titulo display">Suena el silbato</h3>
                <p>
                  El sorteo prueba cientos de repartos, se queda con todos los que dan igual de parejos y
                  elige uno de ésos al azar. Cada vez que lo tocás salen equipos distintos, con el mismo
                  equilibrio.
                </p>
              </div>
            </li>
          </ol>
          <p className="nota">
            {persistente
              ? 'Todo queda guardado en este navegador. No hay cuentas ni contraseñas, y los datos no salen de tu teléfono salvo que compartas el link.'
              : 'Ojo: este navegador no deja guardar datos (¿modo incógnito?). Vas a poder usar la app, pero al cerrar la pestaña se pierde todo.'}
          </p>
        </Seccion>
      </div>
    </>
  );
}
