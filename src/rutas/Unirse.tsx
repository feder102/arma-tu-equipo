import { useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGrupos, type ModoImportacion } from '../estado/grupos';
import { Entrada, Resumen, Seccion, formatearNivel } from '../componentes/Piezas';
import { decodificarGrupo, payloadDelHash } from '../lib/compartir';

export default function Unirse() {
  const { hash } = useLocation();
  const { grupos, importar } = useGrupos();
  const navegar = useNavigate();

  const entrante = useMemo(() => {
    const payload = payloadDelHash(hash);
    return payload ? decodificarGrupo(payload) : null;
  }, [hash]);

  if (!entrante) {
    return (
      <div className="margen">
        <header className="cabecera">
          <h1 className="cabecera__titulo display">Link cortado</h1>
          <p className="cabecera__bajada">
            El link no trae ningún plantel adentro. Suele pasar cuando WhatsApp corta la dirección: pedí
            que te la manden completa, con el <code>#</code> y todo lo que sigue.
          </p>
        </header>
        <Link to="/" className="boton boton--principal">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const existente = grupos.find((g) => g.id === entrante.id);
  const promedio = entrante.jugadores.length
    ? entrante.jugadores.reduce((s, j) => s + j.nivel, 0) / entrante.jugadores.length
    : 0;

  function guardar(modo: ModoImportacion) {
    const grupo = importar(entrante!, modo);
    navegar(`/g/${grupo.id}`, { replace: true });
  }

  return (
    <>
      <header className="banda cabecera cabecera--banda margen">
        <div className="cabecera__marca">
          <h1 className="cabecera__titulo display">Te pasaron {entrante.nombre}</h1>
          <Entrada codigo={entrante.id} />
        </div>
      </header>

      <div className="margen">
        <Resumen
          campos={[
            { rotulo: 'Jugadores', valor: entrante.jugadores.length },
            { rotulo: 'Nivel promedio', valor: formatearNivel(promedio) },
            { rotulo: 'Cancha', valor: `Fútbol ${entrante.cancha}` },
          ]}
        />

        <Seccion titulo="Quiénes vienen en la planilla">
          <ul className="lista-nombres">
            {entrante.jugadores.map((j, i) => (
              <li key={j.id} className="lista-nombres__fila">
                <span className="lista-nombres__numero">{i + 1}</span>
                <span className="escrito">{j.nombre}</span>
                {j.arquero ? <span className="ficha-arq">ataja</span> : <span />}
                <span className="anotado__nivel">{j.nivel}</span>
              </li>
            ))}
          </ul>
        </Seccion>

        <Seccion titulo="Guardar en este teléfono">
          {existente ? (
            <>
              <p className="aviso aviso--tinta">
                Ya tenés una planilla con el código <strong>{existente.id}</strong> ({existente.nombre},{' '}
                {existente.jugadores.length} jugadores). Elegí qué hacer con la que te pasaron.
              </p>
              <div className="botonera botonera--separada">
                <button type="button" className="boton boton--principal" onClick={() => guardar('fusionar')}>
                  Sumar los que faltan
                </button>
                <button type="button" className="boton" onClick={() => guardar('reemplazar')}>
                  Reemplazar la mía
                </button>
                <button type="button" className="boton" onClick={() => guardar('nuevo')}>
                  Guardar aparte
                </button>
              </div>
              <p className="nota">
                Sumar los que faltan mantiene tus niveles y agrega sólo los nombres nuevos. Reemplazar pisa
                el plantel pero conserva tu historial de partidos.
              </p>
            </>
          ) : (
            <>
              <p className="nota nota--arriba">
                Se guarda en este navegador. Después la editás como quieras: es tu copia.
              </p>
              <div className="botonera">
                <button type="button" className="boton boton--principal" onClick={() => guardar('nuevo')}>
                  Guardar la planilla
                </button>
                <Link to="/" className="boton">
                  Ahora no
                </Link>
              </div>
            </>
          )}
        </Seccion>
      </div>
    </>
  );
}
