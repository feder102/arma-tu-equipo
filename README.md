# Arma Tu Equipo

Web para armar equipos de fútbol amateur: cargás el plantel, le ponés un nivel del 1 al 10 a cada
uno y el sorteo reparte al azar pero parejo. Fútbol 5, 7, 11 o la cantidad que quieras, en dos
equipos o en los que entren.

Sin cuentas, sin contraseñas y sin base de datos: todo vive en el navegador de cada persona.

---

## Cómo funciona el sorteo

El objetivo no es el reparto *más justo posible* — ése sería siempre el mismo y el fútbol se
volvería aburrido. Es uno tomado al azar **de entre todos los repartos que están igual de parejos**.

El motor ([`src/lib/armar.ts`](src/lib/armar.ts)) hace esto:

1. **Arranca muchas veces** desde posiciones distintas: unas por draft en serpentina sobre el orden
   de nivel, otras desde el puro azar.
2. **Optimiza cada arranque** intercambiando pares de jugadores entre equipos mientras eso mejore
   el reparto, hasta que no queda ningún intercambio que ayude.
3. **Puntúa** cada reparto con:
   - la diferencia de nivel entre el equipo más fuerte y el más flojo, medida contra la media (así
     un equipo de 6 no parece más fuerte que uno de 5 sólo por ser más);
   - el reparto de los cracks y de los flojos (que las sumas empaten no alcanza: un 10 con cuatro 1
     no es lo mismo que cinco de 2,8);
   - penalizaciones duras si se rompe una regla del grupo o si se amontonan los arqueros.
4. **Junta todos los repartos que empatan** en calidad y recién ahí tira la moneda.

Cada sorteo guarda su semilla, así que el mismo número devuelve siempre exactamente los mismos
equipos. Los tests de [`src/lib/armar.test.ts`](src/lib/armar.test.ts) verifican equilibrio, reparto
de arqueros, reglas, jugadores fijos, determinismo y variedad.

### Extras del motor

- **Arqueros**: se reparten de a uno por equipo antes de equilibrar el resto.
- **Reglas de la casa**: pares de jugadores que van siempre juntos o nunca juntos.
- **Jugadores fijos**: clavás a alguien en su equipo y volvés a sortear el resto.
- **Equipos desparejos**: con 11 anotados salen equipos de 6 y 5, y el equilibrio se mide por
  promedio, no por suma.

---

## Los datos

Todo se guarda en el `localStorage` del navegador, bajo la clave `ate.v1`. No hay servidor de datos,
no hay cuentas y nada sale del dispositivo.

Para pasarle el plantel a otra persona, la app arma un link con el grupo comprimido adentro, colgado
del fragmento (`#`) de la URL. **El fragmento nunca se manda al servidor**, así que los nombres de tu
grupo no quedan en ningún log de nginx.

Es importante entender el límite: **el link es una foto, no una conexión en vivo**. Quien lo abre se
lleva una copia a su teléfono y desde ahí cada uno edita la suya. Si sumás gente después, hay que
volver a pasar el link. El historial de partidos nunca viaja: se queda en el teléfono que lo generó.

---

## Desarrollo

```bash
npm install
npm run dev
```

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo en http://localhost:5173 |
| `npm run build` | Compila a `dist/` |
| `npm run preview` | Sirve el build compilado |
| `npm test` | Corre los tests del motor de sorteo |

Stack: React 19 + TypeScript + Vite. Sin framework de CSS ni de componentes; el sistema visual está
en [`src/estilos/`](src/estilos/).

---

## Desplegar en el VPS de Hetzner

La app compila a archivos estáticos, así que alcanza con nginx. El `docker-compose.yml` levanta dos
contenedores: nginx sirviendo el build, y Caddy adelante resolviendo HTTPS solo.

### 1. Apuntá el dominio

En tu proveedor de DNS, un registro `A` del subdominio que quieras a la IP del VPS. Si el servidor
tiene IPv6, sumá también el `AAAA`.

### 2. Preparar el servidor

Sobre un Ubuntu limpio de Hetzner, como root:

```bash
apt update && apt install -y docker.io docker-compose-v2 git
```

Dejá abiertos sólo SSH y HTTP/HTTPS (esto vale para el firewall del sistema; si usás además el
Cloud Firewall de Hetzner, abrí los mismos puertos ahí):

```bash
ufw allow OpenSSH && ufw allow 80/tcp && ufw allow 443/tcp && ufw --force enable
```

### 3. Levantar la app

```bash
git clone <la-url-de-tu-repo> /opt/arma-tu-equipo && cd /opt/arma-tu-equipo
```

```bash
cp .env.example .env && nano .env
```

Poné tu dominio en `DOMINIO` y guardá. Después:

```bash
docker compose up -d --build
```

La primera vez Caddy tarda unos segundos en sacar el certificado de Let's Encrypt. Mirá que haya
salido bien con:

```bash
docker compose logs -f caddy
```

### 4. Actualizar

```bash
cd /opt/arma-tu-equipo && git pull && docker compose up -d --build
```

El `index.html` se sirve con `no-store` y el resto de los assets llevan hash en el nombre, así que
un deploy nuevo se ve enseguida sin que nadie tenga que limpiar el caché.

### Probar sin dominio

Para ver la app antes de tener el DNS listo, levantá solo el contenedor web y entrá por un túnel SSH:

```bash
docker compose up -d --build web
```

```bash
ssh -L 8080:127.0.0.1:8080 root@LA-IP-DEL-VPS
```

Queda en http://localhost:8080 de tu máquina.

---

## Estructura

```
src/
├─ lib/
│  ├─ armar.ts        El motor de sorteo (y su test al lado)
│  ├─ almacen.ts      Lectura y escritura en localStorage
│  ├─ compartir.ts    Grupo comprimido dentro del link
│  ├─ pecheras.ts     Los colores de equipo
│  ├─ tipos.ts        Jugador, Grupo, Partido, Regla
│  └─ id.ts           Códigos de grupo sin caracteres confusos
├─ estado/grupos.tsx  Contexto de React con los grupos guardados
├─ componentes/       Piezas del formulario
├─ rutas/             Inicio, Plantel, Armar, Sorteo, Historial, Unirse
└─ estilos/           tokens · base · componentes
```

## El diseño

La app está armada como **la planilla del fútbol de los martes**: un formulario impreso a una tinta
sobre papel verdoso de oficina, completado a mano con birome azul.

De ahí salen las dos capas que ordenan toda la interfaz: lo **impreso** (negro, condensada, filetes
finos, renglones numerados) es el formulario, y lo **escrito** (azul birome) es todo lo que carga el
usuario. El único color saturado aparece una sola vez, al final: cuando sale el sorteo, los equipos
son **pecheras**.

Consecuencias prácticas de tratarla como una planilla:

- Se escribe encima. El nombre del grupo y los de los jugadores son campos editables en su lugar, sin
  modo edición ni diálogos.
- Se lee en columnas. El nivel y las acciones caen siempre en la misma vertical, fila tras fila.
- **Se imprime.** Hay una hoja de estilos de impresión: sale sin navegación ni botones, con los
  colores de las pecheras respetados, para pegar en el vestuario.

La interfaz está auditada contra el ruleset de [impeccable.style](https://impeccable.style/slop):
nada de texto por debajo de 11px, contraste AA verificado en todas las rutas, prosa acotada a 68
caracteres por renglón, jerarquía tipográfica con al menos 1.25 entre escalones, sin animar
propiedades de layout y sin barras de acento decorativas.
