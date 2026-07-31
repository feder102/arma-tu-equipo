import { useMemo } from 'react';
import { Link, Outlet, useLocation, useOutletContext, useParams } from 'react-router-dom';
import { useGrupos } from '../estado/grupos';
import { CabeceraGrupo } from '../componentes/Cabecera';
import { decodificarSorteo, payloadSorteoDelHash } from '../lib/compartir';
import type { Grupo } from '../lib/tipos';
import SorteoInvitado from './SorteoInvitado';

export interface ContextoGrupo {
  grupo: Grupo;
  editar: (receta: (grupo: Grupo) => Grupo) => void;
}

export default function MarcoGrupo() {
  const { id } = useParams();
  const { hash, pathname } = useLocation();
  const { obtener, actualizar } = useGrupos();
  const grupo = obtener(id ?? '');

  // Si el link viene con un sorteo compartido dentro del hash lo decodificamos.
  // Sirve para el flow más común: alguien copia la URL del sorteo desde el
  // navegador y la pega en WhatsApp; quien la abre ve los equipos aunque no
  // tenga el grupo cargado en su teléfono.
  const enSorteo = pathname.endsWith('/sorteo');
  const compartido = useMemo(() => {
    if (!enSorteo) return null;
    const payload = payloadSorteoDelHash(hash);
    return payload ? decodificarSorteo(payload) : null;
  }, [enSorteo, hash]);

  if (!grupo) {
    // Tenemos el sorteo dentro del link — lo mostramos sin necesidad de que el
    // grupo exista en este teléfono. Es el "invitado abriendo un link".
    if (compartido) return <SorteoInvitado sorteo={compartido} codigoGrupo={id ?? ''} />;

    return (
      <div className="margen">
        <header className="cabecera">
          <h1 className="cabecera__titulo display">No está</h1>
          <p className="cabecera__bajada">
            Esta planilla no vive en este navegador. La creó otra persona en su teléfono, y los datos no
            salen de ahí salvo que te pase el link con el plantel adentro.
          </p>
          <p className="nota">
            Si te pasaron un link, revisá que esté completo: los links de esta app llevan un{' '}
            <code>#</code> con un texto largo después. WhatsApp a veces los recorta.
          </p>
        </header>
        <Link to="/" className="boton boton--principal">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const editar = (receta: (grupo: Grupo) => Grupo) => actualizar(grupo.id, receta);

  return (
    <>
      <CabeceraGrupo grupo={grupo} onRenombrar={(nombre) => editar((g) => ({ ...g, nombre }))} />
      <div className="margen">
        <Outlet context={{ grupo, editar } satisfies ContextoGrupo} />
      </div>
    </>
  );
}

export function useContextoGrupo(): ContextoGrupo {
  return useOutletContext<ContextoGrupo>();
}
