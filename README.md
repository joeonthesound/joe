# Josueth Acevedo Cruz — sitio multiidioma (arquitectura modular)

Sitio estático multilingüe (8 idiomas) con contenido centralizado en un único JSON,
módulos ES6 e imágenes servidas desde Cloudflare R2 con fallback automático.
No requiere backend ni proceso de build: se publica tal cual en cualquier hosting estático.

---

## 1. Estructura del proyecto

```text
/
├── index.html                  → redirector de idioma (autocontenido, no tocar salvo idiomas nuevos)
├── .nojekyll                   → necesario para GitHub Pages
├── es/ br/ en/ fr/ de/ ar/ zh/ ja/
│   └── index.html              → "carcasa" por idioma: SOLO metadatos SEO + layout base
├── assets/
│   ├── css/main.css            → todos los estilos (tema claro/oscuro + componentes nuevos)
│   └── js/
│       ├── app.js              → punto de entrada (composición y arranque)
│       ├── core/
│       │   ├── config.js       → rutas base (relativas al módulo: funciona en subdirectorios)
│       │   ├── locale.js       → detección de idioma (data-lang / URL), RTL, navegación entre idiomas
│       │   ├── content-loader.js → fetch del JSON + pantalla de error
│       │   ├── i18n.js         → resolución de textos multiidioma
│       │   ├── renderer.js     → bloques de página, navegación, tema
│       │   └── router.js       → router SPA (#/inicio, #/proyectos, …)
│       ├── components/
│       │   ├── image-manager.js   → imágenes desde JSON + cadena de fallback R2
│       │   ├── project-grid.js    → tarjetas de proyecto clicables
│       │   ├── project-modal.js   → modal reutilizable (accesible)
│       │   ├── youtube-player.js  → video opcional de YouTube
│       │   ├── ai-classification.js → sección IA + JSON-LD por idioma
│       │   └── opportunity-form.js  → formulario multipaso (WhatsApp / email)
│       └── utils/
│           ├── dom.js          → escape HTML, animaciones reveal
│           └── validation.js   → email, ID de YouTube, visibilidad
├── data/
│   └── site-content.json       → ÚNICA FUENTE DE VERDAD de todo el contenido
├── img/me.png                  → foto local (último recurso si R2 no responde)
└── archive/                    → versiones históricas sin uso (index-Pre.html, old-index-2.html)
```

Las URLs públicas no cambian: `/`, `/es/`, `/br/`, `/en/`, `/fr/`, `/de/`, `/ar/`, `/zh/`, `/ja/`.

## 2. El archivo JSON principal

`data/site-content.json` contiene TODO: textos en 8 idiomas, navegación, rutas,
proyectos (con su información extendida), imágenes, configuración de Cloudflare R2,
formulario y datos estructurados. **Editar el sitio = editar este archivo.**
Nunca es necesario tocar los ocho HTML para cambiar contenido.

Valida la sintaxis después de cada edición:

```bash
python -m json.tool data/site-content.json > /dev/null && echo OK
```

## 3. Cómo agregar una imagen

Cualquier objeto `media` del JSON acepta estas claves:

```json
"media": {
  "r2Path": "paginahv/mi-imagen.png",      ← ruta dentro del bucket R2 (recomendado)
  "src": "",                                ← o una URL completa / ruta local explícita
  "localSrc": "img/me.png",                 ← respaldo local opcional
  "alt":   { "es": "…", "en": "…" },        ← texto alternativo POR IDIOMA
  "title": { "es": "…", "en": "…" },
  "caption": { "es": "…", "en": "…" },
  "width": 1200, "height": 800, "loading": "lazy",
  "placeholder": { "enabled": true, "seoText": "…" }
}
```

Cadena de carga automática: dominio personalizado R2 → dominio `r2.dev` →
placeholder de R2 (`paginahv/me.png`) → archivo local → placeholder SEO en HTML.
Si una URL falla, el navegador prueba la siguiente sin intervención.

## 4. Cómo cambiar las URLs de Cloudflare R2

En `data/site-content.json`, bloque `media.r2`:

```json
"media": {
  "r2": {
    "primaryBaseUrl": "https://media.josuethacevedo.com",   ← tu dominio personalizado
    "altBaseUrl": "https://pub-CAMBIA-ESTE-ID.r2.dev",      ← URL pública del bucket
    "placeholderPath": "paginahv/me.png"
  },
  "localPlaceholder": "img/me.png"
}
```

Sustituye ambos valores por los reales de tu bucket. Mientras `altBaseUrl`
contenga la palabra `CAMBIA`, ese dominio se ignora (evita peticiones rotas).
Nunca pongas aquí tokens ni claves: solo URLs públicas de lectura.

## 5. Cómo agregar un proyecto

Duplica un elemento del array `projects` y cambia:

```json
{
  "id": "mi-proyecto-unico",
  "visible": true,
  "title":       { "es": "…", "en": "…" },
  "category":    { "es": "…", "en": "…" },
  "description": { "es": "…", "en": "…" },
  "tags": ["Etiqueta1", "Etiqueta2"],
  "media": { "r2Path": "paginahv/projects/mi-proyecto-unico/cover.png", "alt": { "es": "…", "en": "…" } },
  "projectUrl": "",
  "showProjectButton": true,
  "extended": {
    "paragraphs": { "es": ["p1", "p2", "p3"], "en": ["p1", "p2", "p3"] },
    "images": [
      { "r2Path": "paginahv/projects/mi-proyecto-unico/detail-1.png", "alt": { "es": "…", "en": "…" } },
      { "r2Path": "paginahv/projects/mi-proyecto-unico/detail-2.png", "alt": { "es": "…", "en": "…" } }
    ],
    "keywords": ["k1", "k2", "k3"],
    "youtubeId": ""
  }
}
```

La tarjeta aparece en `/proyectos` en los 8 idiomas y el modal se genera solo.
`"visible": false` oculta el proyecto sin borrarlo.

## 6. Cómo editar las traducciones

- Textos largos: objetos `{ "es": "…", "en": "…" }`. Si falta un idioma, se usa
  español → inglés como respaldo (es el patrón de todo el sitio).
- Textos de interfaz (botones, etiquetas del modal…): `languages.<idioma>.<clave>`,
  ya traducidos a los 8 idiomas (`projectDetails`, `closeModal`, `keywordCloud`, etc.).
- Para añadir un idioma a un texto concreto, agrega su clave: `"fr": "…"`.

## 7. Cómo agregar palabras clave

En el proyecto: `extended.keywords` es un array de cadenas; se pinta como nube
de pastillas en el modal. Las keywords de SEO/ATS del perfil están en
`aiClassification.searchIntentKeywords` y `aiClassification.atsKeywords`.

## 8. Cómo agregar un video de YouTube

Copia el ID del video (los 11 caracteres después de `watch?v=`) y ponlo en:

```json
"extended": { "youtubeId": "dQw4w9WgXcQ" }
```

Se incrusta con `youtube-nocookie.com` (privacidad mejorada), responsive 16:9,
con carga diferida. El reproductor solo se muestra si el ID es válido.

## 9. Cómo quitar el video

Deja el campo vacío: `"youtubeId": ""` (o elimina la clave). No queda espacio
en blanco: la sección del video desaparece por completo del modal.

## 10. Cómo crear un nuevo idioma

1. En `settings`: añade el código a `availableLanguages`, y entradas en
   `languageLabels`, `languageNames`, `languageHtmlCodes`, `languagePaths`
   (y `rtlLanguages` si se escribe de derecha a izquierda).
2. En `languages`: crea el paquete de textos de interfaz copiando el de `es`.
3. Traduce los textos de contenido añadiendo la clave del idioma donde quieras
   (lo no traducido usa el respaldo es/en automáticamente).
4. Crea la carpeta `/xx/` copiando `es/index.html` y ajusta: `lang`, `data-lang`,
   `<title>`, metadescripciones, `canonical` y OG. Añade el `hreflang` del nuevo
   idioma en las 8 carcasas existentes y en el redirector raíz (`index.html`,
   arrays `supported` y `paths`).

## 11. Cómo probar el proyecto localmente

El contenido se carga con `fetch()`, que **no funciona abriendo el HTML con
doble clic** (protocolo `file://`). Usa un servidor local desde la raíz:

```bash
python -m http.server 8000
```

o, si tienes Node instalado (solo para desarrollo, no es requisito del sitio):

```bash
npx serve .
```

Luego visita `http://localhost:8000/` (o `http://localhost:8000/es/`, `/ar/`, …).

## 12. Cómo desplegar en un hosting estático

Sube el contenido completo del proyecto (tal cual, sin build) a:

- **GitHub Pages**: push a la rama configurada. `.nojekyll` ya está incluido.
  Funciona también en Pages de proyecto (subdirectorio): todas las rutas internas
  son relativas.
- **Cloudflare Pages**: proyecto sin framework, comando de build vacío,
  directorio de salida `/`.
- **Netlify / Vercel / cualquier CDN**: carpeta raíz como directorio de publicación.

Requisitos del servidor: ninguno (HTML/CSS/JS estáticos). Solo asegúrate de que
`data/site-content.json` se sirva con el sitio (mismo origen).

---

### Notas

- SEO internacional: cada carcasa conserva su `canonical`, `hreflang`, Open Graph
  y JSON-LD originales; el motor inyecta además JSON-LD dinámico por idioma.
- Conviene revisar/humanizar las traducciones largas antes de publicar.
- `/archive/` no se sirve enlazado desde ninguna página; puedes borrarlo cuando quieras.
