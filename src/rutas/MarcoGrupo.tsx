import { Link, Outlet, useOutletContext, useParams } from 'react-router-dom';
import { useGrupos } from '../estado/grupos';
import { CabeceraGrupo } from '../componentes/Cabecera';
import type { Grupo } from '../lib/tipos';

export interface ContextoGrupo {
  grupo: Grupo;
  editar: (receta: (grupo: Grupo) => Grupo) => void;
}

export default function MarcoGrupo() {
  const { id } = useParams();
  const { obtener, actualizar } = useGrupos();
  const grupo = obtener(id ?? '');

  if (!grupo) {
    return (
      <div className="margen">
        <header className="cabecera">
          <h1 className="cabecera__titulo display">No está</h1>
          <p className="cabecera__bajada">
            Esta planilla no existe en este navegador. Puede que la hayas abierto en otro teléfono, o que
            el link haya llegado cortado.
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
