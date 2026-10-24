---
version: alpha
name: Arma Tu Equipo
description: Sorteo de equipos parejos para el fútbol amateur de todas las semanas; tiene que sentirse como llegar a la cancha de 5 un martes a la noche.
colors:
  cal: "#F3F5EF"          # el fondo: la cal de las líneas, no papel crema
  cesped: "#1D6236"       # dominante: la banda de cabecera, la cancha, la acción principal
  cesped-claro: "#24703F" # la franja alternada del corte del pasto
  cesped-hondo: "#134628" # hover y presionado de la acción principal
  tinta: "#0E2116"        # texto: verde casi negro, sale del pasto de noche
  tinta-2: "#3F5447"      # texto secundario (7.4:1 sobre cal)
  linea: "#CFD8CF"        # separadores
  amarilla: "#F4C20D"     # tarjeta amarilla: avisos, el arquero, la pestaña activa sobre el verde
  roja: "#C3122B"         # tarjeta roja: borrar, errores sin vuelta
typography:
  display:
    fontFamily: Big Shoulders Display Variable
    fontWeight: 800
    letterSpacing: 0.005em
  body:
    fontFamily: Archivo Variable
    fontSize: 1rem
    lineHeight: 1.5
rounded:
  control: 8px
  panel: 14px
  ficha: 999px
spacing:
  sm: 0.5rem
  md: 1rem
  lg: 2rem
components:
  boton-principal:
    backgroundColor: "{colors.cesped}"
    textColor: "{colors.cal}"
    rounded: "{rounded.control}"
---

## Overview

Una app para el que organiza el fútbol de la semana: carga el plantel, le pone nivel a cada uno y
sortea equipos parejos. Se usa parado al lado de la cancha, con el celular en la mano.

El look sale de la cancha de 5 de alquiler: el sintético cortado en franjas, las líneas de cal,
las pecheras de colores que se reparten antes de arrancar, las tarjetas del árbitro y los números de
camiseta. Nada de formulario impreso: la app es la cancha.

## Colors

- **Cal (#F3F5EF):** el fondo de lectura. Blanco frío con un toque de verde, como la tiza de las líneas.
- **Césped (#1D6236):** el color que domina. Va en la banda de arriba (con el corte del pasto en
  franjas), en la cancha del sorteo y en la acción principal. Texto cal encima: 6.7:1; el texto secundario sobre verde (#D8E7DB) pasa 4.5:1 en las dos franjas.
- **Tinta (#0E2116):** el texto. 15:1 sobre cal.
- **Amarilla (#F4C20D):** sólo con un trabajo: avisar (como la tarjeta), marcar al arquero y señalar
  la pestaña activa sobre el verde. Nunca como fondo de un bloque grande.
- **Roja (#C3122B):** borrar y errores. Nada más.
- **Pecheras:** los colores de los equipos (`src/lib/pecheras.ts`) aparecen recién en el sorteo.

## Typography

- **Big Shoulders Display** para títulos, números de camiseta, marcadores y botones: es letra de
  cartel de estadio, condensada y alta. Va en mayúscula sólo en botones y nombres de equipo.
- **Archivo** para todo lo demás. Los rótulos de los campos van en minúscula, en la letra de texto,
  sin espaciado: un rótulo es información, no decoración.
- No hay monoespaciada. Los números usan `tabular-nums`.

## Layout

Una columna de 820px como máximo. Arriba, la banda de césped con el título y las pestañas; abajo,
el contenido sobre cal. La idea estructural: **el sorteo se dibuja en una cancha**. Con dos equipos,
cada uno ocupa su mitad, en formación, con una camiseta del color de su pechera por jugador.

## Elevation & Depth

Casi todo es plano. Sólo flotan los paneles de equipo (sombra corta, del color tinta) y la barra
de "Sortear equipos", que queda pegada abajo.

## Shapes

Controles con 8px de radio, paneles con 14px, fichas (pecheras chicas, estado de jugador) en
píldora. Las camisetas son una silueta SVG propia.

## Components

`CabeceraGrupo` (banda de césped + pestañas), `Entrada` (el código del grupo como una entrada de
cancha con troquel), `Nivel` (diez barras que suben como la tribuna), `CanchaSorteo`,
`TarjetaPechera`, `Marcador` (la comparación de fuerzas, como el marcador de la tele).

## Do's and Don'ts

- Do reusar estos tokens desde `src/estilos/tokens.css`; no inventar colores en un componente.
- Do usar la amarilla y la roja como tarjetas: avisos y peligro.
- Don't: rótulos en mayúscula espaciada ni letra mono para datos chicos (SD4).
- Don't: una palabra resaltada en el título (SD5), números decorativos 01/02/03 (SD6), flechas
  pegadas al texto (CP3), emoji como íconos (I2).
- Don't: fondo casi negro con un verde ácido (SD2). El verde es pasto, no neón.
