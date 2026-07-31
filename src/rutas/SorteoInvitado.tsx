import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Balanza, TarjetaPechera } from '../componentes/Pecheras';
import { Resumen, Seccion, Sello, formatearFecha, formatearNivel, useCopiar } from '../componentes/Piezas';
import { useGrupos } from '../estado/grupos';
import { pechera } from '../lib/pecheras';
import type { SorteoCompartido } from '../lib/compartir';

/**
 * La vista del sorteo cuando llegaste por un link y no tenés el grupo local.
 *
 * Read-only: no podés fijar jugadores ni volver a sortear, porque no es tu
 * plantel. Sí podés copiar los equipos, mandarlos por WhatsApp, y — si querés
 * arrancar tu propia planilla con este plantel — guardarlo en tu teléfono.
 */
export default function SorteoInvitado({
  sorteo,
  codigoGrupo,
}: {
  sorteo: SorteoCompartido;
  codigoGrupo: string;
}) {
  const { crear, actualizar } = useGrupos();
  const navegar = useNavigate();
  const [copiado, copiar] = useCopiar();
  const [guardado, setGuardado] = useState(false);

  const equipos = useMemo(() => sorteo.equipos.map((e) => e.jugadores), [sorteo]);
  const fuerzas = equipos.map((e) => e.reduce((s, j) => s + j.nivel, 0));
  const promedios = equipos.map((e, i) => (e.length ? fuerzas[i] / e.length : 0));
  const diferencia = promedios.length ? Math.max(...promedios) - Math.min(...promedios) : 0;
  const totalJugadores = equipos.reduce((n, e) => n + e.length, 0);

  const textoParaPasar = [
    `${sorteo.nombreGrupo} — equipos`,
    '',
    ...equipos.flatMap((e, i) => [
      `${nombrePechera(sorteo.equipos[i].pechera, i).toUpperCase()} (nivel ${formatearNivel(promedios[i])})`,
      ...e.map((j) => `· ${j.nombre}${j.arquero ? ' (arq)' : ''}`),
      '',
    ]),
    window.location.href,
  ].join('\n');

  function guardarComoPropio() {
    const grupo = crear(sorteo.nombreGrupo, sorteo.cancha);
    actualizar(grupo.id, (g) => ({ ...g, jugadores: sorteo.jugadores }));
    setGuardado(true);
    navegar(`/g/${grupo.id}`);
  }

  return (
    <>
      <header className="cabecera-grupo">
        <div className="margen cabecera-grupo__cinta">
          <Link to="/" className="volver">
            Todas las planillas
          </Link>
          <span className="dato cabecera-grupo__linea">
            Fútbol {sorteo.cancha} · {totalJugadores} jugadores
          </span>
        </div>

        <h1 className="solo-lectores">Sorteo compartido — {sorteo.nombreGrupo}</h1>

        <div className="margen cabecera-grupo__tapa">
          <div>
            <p className="etiqueta">Sorteo compartido</p>
            <p className="titulo-editable" style={{ pointerEvents: 'none' }}>
              {sorteo.nombreGrupo}
            </p>
          </div>
          {codigoGrupo && <Sello codigo={codigoGrupo} />}
        </div>
      </header>

      <div className="margen">
        <Resumen
          campos={[
            { rotulo: 'Sorteado el', valor: formatearFecha(sorteo.fecha) },
            { rotulo: 'Equipos', valor: equipos.length },
            { rotulo: 'Nivel promedio', valor: formatearNivel(
              sorteo.jugadores.reduce((s, j) => s + j.nivel, 0) / (sorteo.jugadores.length || 1),
            ) },
          ]}
        />

        <Seccion titulo="Así quedaron los equipos">
          <div className="pecheras">
            {equipos.map((jugadores, i) => (
              <TarjetaPechera
                key={i}
                indice={i}
                jugadores={jugadores}
                promedio={promedios[i]}
                fijados={{}}
                onFijar={() => {}}
              />
            ))}
          </div>

          <Balanza fuerzas={fuerzas} diferencia={diferencia} />

          <div className="botonera botonera--separada">
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
            Este es un sorteo compartido: no está guardado en tu teléfono y no lo podés modificar. Los
            datos viven adentro de este link, así que si lo perdés lo perdés.
          </p>
        </Seccion>

        <Seccion titulo="¿Te sirve el plantel?">
          <p className="nota nota--arriba">
            Si querés seguir usando esta lista de jugadores en tu teléfono, guardala como planilla propia:
            podés editar los nombres, cambiar niveles y armar nuevos sorteos cuando quieras.
          </p>
          <div className="botonera">
            <button
              type="button"
              className="boton boton--principal"
              onClick={guardarComoPropio}
              disabled={guardado}
            >
              {guardado ? 'Guardado' : 'Guardar el plantel en mi teléfono'}
            </button>
          </div>
        </Seccion>
      </div>
    </>
  );
}

function nombrePechera(id: string, indice: number): string {
  // Buscamos en el catálogo o caemos a la asignada por índice.
  const catalogo = pechera(indice);
  return catalogo.id === id ? catalogo.nombre : catalogo.nombre;
}
