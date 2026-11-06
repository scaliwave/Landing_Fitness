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
- **`overflow` en ancestros:** no pongas `overflow: hidden` en `.scene` ni en ningún ancestro de `.scene-stage`, porque rompe el `sticky`. El recorte ya lo hace `.scene-stage`.
- **Rutas relativas:** el sitio se sirve desde el subdirectorio `/Landing_Fitness/`. Usa `assets/...`, nunca `/assets/...`, o los archivos darán 404 en producción.
- **Móvil:** los cubos y las tarjetas se abren con hover en escritorio y con toque en móvil. Prueba ambos casos, y también pantallas bajas, donde ya hubo contenido recortado.
- **Movimiento reducido:** respeta `prefers-reduced-motion`, que ya se tiene en cuenta en CSS y JS.

## WhatsApp

Los 3 botones de contacto están en `index.html` (plan Plus, plan Diamante y llamado final) y usan este formato:

```text
https://wa.me/573024195551?text=<mensaje codificado para URL>
```

- Si cambia el número, actualízalo en los 3 enlaces.
- Usa `wa.me/<número>`, no un enlace `wa.me/message/...`: cada botón necesita su propio mensaje en `?text=`.

## Ejecutar y verificar

No hay dependencias, compilación ni pruebas automatizadas.

```bash
python -m http.server 8080
```

Después abre http://localhost:8080 y revisa los cambios en escritorio y en móvil, sobre todo el scroll de las 5 escenas.

## Publicación

`static.yml` publica en GitHub Pages con cada push a `main` y sube **todo el repositorio**, no solo el sitio. Cualquier archivo que se agregue queda accesible públicamente en la URL del sitio, así que no incluyas secretos ni archivos privados.
