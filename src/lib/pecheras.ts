/** Los equipos no se llaman A y B: se llaman por el color de la pechera, como en la cancha. */
export interface Pechera {
  id: string;
  nombre: string;
  corto: string;
  tela: string;
  tinta: string;
}

export const PECHERAS: Pechera[] = [
  { id: 'naranja', nombre: 'Naranjas', corto: 'NAR', tela: '#E2560F', tinta: '#1A1A15' },
  { id: 'negra', nombre: 'Negras', corto: 'NEG', tela: '#1A1A15', tinta: '#EDF0E7' },
  { id: 'blanca', nombre: 'Blancas', corto: 'BLA', tela: '#FCFCF7', tinta: '#1A1A15' },
  { id: 'verde', nombre: 'Verdes', corto: 'VER', tela: '#18713F', tinta: '#F4F5EE' },
  { id: 'celeste', nombre: 'Celestes', corto: 'CEL', tela: '#3C87C4', tinta: '#0E1A24' },
  { id: 'roja', nombre: 'Rojas', corto: 'ROJ', tela: '#AE3128', tinta: '#F4F5EE' },
];

export function pechera(indice: number): Pechera {
  return PECHERAS[indice % PECHERAS.length];
}
