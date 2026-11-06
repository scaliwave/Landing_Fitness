# Proyecto TEO

Landing page de **Proyecto TEO**, un coaching de gimnasio 1 a 1 con rutinas personalizadas, guía en video y acompañamiento por WhatsApp.

**Sitio web:** https://scaliwave.github.io/Landing_Fitness/

## Tecnologías

HTML, CSS y JavaScript sin frameworks. No necesita instalar dependencias ni compilar.

## Cómo ejecutarlo

1. Clona el repositorio:

   ```bash
   git clone https://github.com/scaliwave/Landing_Fitness.git
   cd Landing_Fitness
   ```

2. Inicia un servidor local (requiere Python 3):

   ```bash
   python -m http.server 8080
   ```

3. Abre http://localhost:8080 en tu navegador.

También puedes abrir `index.html` directamente, o usar la extensión Live Server de VS Code.

## Estructura del proyecto

```text
Landing_Fitness/
├── .github/workflows/
│   └── static.yml          # Publicación en GitHub Pages
├── .vscode/
│   └── launch.json         # Depuración en Chrome (localhost:8080)
├── assets/img/             # Imágenes del sitio (WebP) y favicon
├── css/
│   └── style.css           # Estilos y diseño responsive
├── js/
│   └── main.js             # Animaciones de scroll e interacciones
├── scripts/
│   └── optimize-images.py  # Conversión de imágenes a WebP
├── AGENTS.md               # Contexto del proyecto para agentes de IA
├── index.html              # Página y contenido del sitio
└── README.md
```

## Publicación

Cada push a la rama `main` publica el sitio automáticamente en GitHub Pages.
