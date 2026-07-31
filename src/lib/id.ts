/** Sin 0/O ni 1/I: el código se dicta por WhatsApp y tiene que entenderse a la primera. */
const ALFABETO = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

function azarSeguro(largo: number): Uint8Array {
  const bytes = new Uint8Array(largo);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < largo; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytes;
}

export function codigoGrupo(largo = 6): string {
  return Array.from(azarSeguro(largo), (b) => ALFABETO[b % ALFABETO.length]).join('');
}

export function nuevoId(): string {
  return `${Date.now().toString(36)}${codigoGrupo(6).toLowerCase()}`;
}

export function normalizarCodigo(entrada: string): string {
  return entrada
    .toUpperCase()
    .replace(/O/g, '0')
    .replace(/[^A-Z0-9]/g, '')
    .replace(/0/g, 'O')
    .slice(0, 12);
}
