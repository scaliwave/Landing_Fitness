# AGENTS.md

Contexto para agentes que trabajen en este repositorio.

## Qué es

Landing page en español de **Proyecto TEO** ("Transforma - Enfócate - Optimiza"), el coaching de gimnasio 1 a 1 de Teo. Su objetivo es que el visitante escriba por WhatsApp para contratar un plan. Los precios están en pesos colombianos (COP).

- **Sitio:** https://scaliwave.github.io/Landing_Fitness/
- **Repositorio:** https://github.com/scaliwave/Landing_Fitness

## Reglas de trabajo

- **No hagas `git push` sin autorización explícita del dueño del repositorio.** Cada push a `main` publica el sitio en producción. Al terminar, deja los cambios listos y entrega el mensaje de commit para que el dueño los valide y los suba.
- No agregues frameworks, dependencias ni pasos de compilación sin que se pidan: el sitio es HTML, CSS y JavaScript plano.
- Escribe en español el contenido visible para el usuario.
- No inventes ni reescribas testimonios, resultados o precios. Los testimonios son reales y cualquier cambio debe venir del dueño.

## Estructura

| Ruta | Contenido |
|---|---|
| `index.html` | Todo el contenido y el marcado de la página |
| `css/style.css` | Estilos, variables de tema en `:root` y diseño responsive |
| `js/main.js` | Animaciones ligadas al scroll, navegación por puntos y cubos/tarjetas T.E.O |
| `js/utm-whatsapp.js` | Agrega la palabra clave del anuncio (`utm_content`) al mensaje de WhatsApp |
| `assets/img/` | Imágenes en WebP y `favicon.png` |
| `scripts/optimize-images.py` | Conversión puntual a WebP. Requiere Pillow y una carpeta `uploads/` con los originales, que no está en el repositorio |
| `.github/workflows/static.yml` | Publicación en GitHub Pages |

## Cómo funciona la página

Son 5 escenas `<section class="scene">`, identificadas con `data-scene-index`:

| Índice | Escena | Contenido |
|---|---|---|
| 0 | Hola, soy Teo | Presentación |
| 1 | T.E.O | Cubos y tarjetas de Transforma, Enfócate y Optimiza |
| 2 | Testimonios | Antes y después con testimonios reales |
| 3 | Planes | Planes Plus y Diamante |
| 4 | Empezar | Llamado final a escribir por WhatsApp |

Si agregas, quitas o reordenas escenas, actualiza también el array `LABELS` de `js/main.js` y las alturas por escena de `css/style.css`.

## Puntos delicados

- **Efecto de scroll:** cada `.scene` mide más que la pantalla (120-150 % de su altura) y dentro lleva un `.scene-stage` con `position: sticky`. No reduzcas esas alturas a 100 %, porque el efecto se dispara de golpe.
- **Sin scroll interno:** ninguna escena debe mostrar una barra propia. `fitScenes()` en `js/main.js` mide cada escena y, si su contenido no cabe en la pantalla, le agrega `.is-flow`: deja de usar `sticky`, crece con su contenido y se lee con el scroll de la página. En esas escenas la altura de 120-150 % no aplica.
- **Scroll fluido en móvil:** en pantallas táctiles y de hasta 720px, `main.js` solo debe animar `transform` y `opacity` en cada frame de scroll. No agregues ahí transiciones CSS sobre esos elementos, filtros animados, `backdrop-filter` en áreas grandes ni alturas con `dvh`: fueron la causa de los tirones.
- **`overflow` en ancestros:** no pongas `overflow: hidden` en `.scene` ni en ningún ancestro de `.scene-stage`, porque rompe el `sticky`. El recorte ya lo hace `.scene-stage`.
- **Rutas relativas:** el sitio se sirve desde el subdirectorio `/Landing_Fitness/`. Usa `assets/...`, nunca `/assets/...`, o los archivos darán 404 en producción.
- **Móvil:** los cubos y las tarjetas se abren con hover en escritorio y con toque en móvil. Prueba ambos casos, y también pantallas bajas, donde ya hubo contenido recortado.
- **Movimiento reducido:** respeta `prefers-reduced-motion`, que ya se tiene en cuenta en CSS y JS.

## WhatsApp

Los 4 botones de contacto están en `index.html` (plan Plus, plan Diamante, llamado final y el botón flotante `#waFloat`) y usan este formato:

```text
https://wa.me/573024195551?text=<mensaje codificado para URL>
```

- Si cambia el número, actualízalo en los 4 enlaces.
- **Botón flotante:** usa el ícono y el verde oficiales de WhatsApp. En escritorio es un botón redondo abajo a la derecha que muestra "Escríbeme por WhatsApp" al pasar el mouse; en móvil es una barra centrada abajo con el ícono y el texto. `js/main.js` le agrega `.is-hidden` en la última escena, que ya tiene su propio botón. En móvil, el contenido de las escenas deja `--float-clear` libre abajo para que el botón no tape los botones de los planes.
- Usa `wa.me/<número>`, no un enlace `wa.me/message/...`: cada botón necesita su propio mensaje en `?text=`.
- **Trazabilidad de anuncios:** `js/utm-whatsapp.js` lee `?utm_content=` de la URL del anuncio, lo guarda 7 días y, al tocar un botón de WhatsApp, agrega la palabra al final del mensaje, por ejemplo `(ESPALDA)`. No cambia los enlaces del HTML: los modifica en el momento del clic.
- **Meta Pixel:** el código del píxel (ID `29146696478331076`) está en el `<head>` de `index.html` y registra `PageView`. Al tocar un botón de WhatsApp, `js/utm-whatsapp.js` también envía el evento `Contact` con la palabra del anuncio.

## Promoción Black Friday

La escena de Planes muestra precios de Black Friday hasta el final del 30 de noviembre de 2026, hora de Colombia.

- **Precios promocionales:** Plus a $124.900 (normal: $149.900) y Diamante a $299.999 (normal: $399.900). Están en `index.html`, en los elementos `.promo-only`. La primera pantalla también anuncia el precio de Plus (`.hero-offer`) junto al botón "Ver planes", que lleva a `#planes`.
- **Énfasis visual (negro y dorado):** los colores están en las variables `--gold-*` de `:root` en `css/style.css`. La portada muestra una etiqueta dorada, el botón "Ver planes" dorado metálico y una mini cuenta regresiva (`[data-promo-short]`); al terminar la promoción el botón vuelve al azul. En Planes: banner negro con borde dorado, insignias "17% OFF" y "25% OFF" (`.plan-off`, calculadas sobre los precios normales) y una ráfaga de confeti (`launchConfetti` en `js/main.js`) la primera vez que el banner entra en pantalla. El confeti se dibuja en un `<canvas>` fijo que se borra solo a los ~3,5 s, y no aparece con `prefers-reduced-motion`. Si cambian los precios, recalcula los porcentajes.
- **Fin automático:** cuando pasa `PROMO_END` en `js/main.js`, la página agrega `.promo-ended` a `<html>`, oculta `.promo-only` y muestra `.regular-only`, que tiene los precios normales.
- **Otra promoción:** cambia `PROMO_END`, los textos con la fecha y los precios. No taches un precio que no se haya cobrado de verdad.

## Ejecutar y verificar

No hay dependencias, compilación ni pruebas automatizadas.

```bash
python -m http.server 8080
```

Después abre http://localhost:8080 y revisa los cambios en escritorio y en móvil, sobre todo el scroll de las 5 escenas.

## Publicación

`static.yml` publica en GitHub Pages con cada push a `main` y sube **todo el repositorio**, no solo el sitio. Cualquier archivo que se agregue queda accesible públicamente en la URL del sitio, así que no incluyas secretos ni archivos privados.
