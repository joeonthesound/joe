# Josueth Acevedo Cruz — sitio multiidioma (mapa de contenido)

Sitio estático multilingüe (8 idiomas) con **todo el contenido en un solo archivo**:
`data/site-content.json`. No requiere backend ni build: se publica tal cual.

> **Cómo usar este README:** es un mapa. Para cambiar *cualquier* parte visible del
> sitio, busca esa parte en la sección **«Mapa visual → JSON»** y te dirá exactamente
> qué clave del JSON editar. Las secciones siguientes detallan, campo por campo, la
> estructura de cada bloque y de cada tipo de tarjeta.

**Regla de oro:** el contenido se edita SOLO en `data/site-content.json`.
Nunca hay que tocar los archivos HTML para cambiar textos, imágenes o proyectos.
Tras cada edición, valida la sintaxis:

```bash
python -m json.tool data/site-content.json > /dev/null && echo OK
```

Y previsualiza con un servidor local (ver §13):

```bash
python -m http.server 8000   # luego abre http://localhost:8000/es/
```

---

## 1. Estructura de archivos

```text
/
├── index.html                  redirector de idioma (autocontenido)
├── .nojekyll                   necesario para GitHub Pages
├── es/ br/ en/ fr/ de/ ar/ zh/ ja/
│   └── index.html              "carcasa" por idioma: SOLO metadatos SEO + layout
├── assets/
│   ├── css/main.css            todos los estilos (tema claro/oscuro + componentes)
│   └── js/
│       ├── app.js              punto de entrada (compone módulos y arranca)
│       ├── core/
│       │   ├── config.js       rutas base (relativas: funciona en subdirectorios)
│       │   ├── locale.js       idioma (data-lang/URL), RTL, cambio de idioma
│       │   ├── content-loader.js  fetch del JSON + pantalla de error
│       │   ├── i18n.js         resuelve textos multiidioma
│       │   ├── renderer.js     dibuja cada bloque, el menú, el footer y el tema
│       │   └── router.js       router SPA (#/inicio, #/proyectos, …)
│       ├── components/
│       │   ├── image-manager.js    imágenes desde JSON + cadena de fallback R2
│       │   ├── project-grid.js     tarjetas de proyecto clicables
│       │   ├── project-modal.js    modal reutilizable (accesible)
│       │   ├── youtube-player.js   video opcional de YouTube
│       │   ├── ai-classification.js sección IA + JSON-LD por idioma
│       │   └── opportunity-form.js  formulario multipaso (WhatsApp/email)
│       └── utils/
│           ├── dom.js          escape HTML, animaciones reveal
│           └── validation.js   email, ID de YouTube, visibilidad
├── data/
│   └── site-content.json       ★ ÚNICA FUENTE DE VERDAD ★
├── img/me.png                  foto local (respaldo si R2 no responde)
└── archive/                    versiones antiguas sin uso
```

Las URLs públicas no cambian: `/`, `/es/`, `/br/`, `/en/`, `/fr/`, `/de/`, `/ar/`, `/zh/`, `/ja/`.

---

## 2. Cómo se construye una página (modelo mental)

Cada página = una **ruta** (`routes`) que lista **bloques** en orden. Cada bloque
lee su contenido de una clave del JSON con su mismo nombre. Ejemplo:

```
URL #/inicio  →  routes["/inicio"].blocks = ["hero","profile","expertisePreview",
                  "collaboration","availability","resources","aiClassification","ctaBand"]
                                  │        │
                                  │        └── lee la clave  profile
                                  └── lee la clave  hero
```

Para **reordenar, quitar o repetir** una sección dentro de una página, edita el array
`blocks` de esa ruta. Para **ocultar** un bloque en todo el sitio, pon `"visible": false`
en su clave.

**Textos multiidioma:** casi todos los textos son objetos `{ "es": "...", "en": "..." }`.
Si falta un idioma, el sitio usa español → inglés como respaldo automático. Puedes añadir
cualquier idioma agregando su clave (`"fr": "..."`, `"ja": "..."`, etc.).

---

## 3. Mapa visual → JSON (de un vistazo)

| Parte visible del sitio | Clave en `site-content.json` | Bloque / detalle |
|---|---|---|
| **CABECERA** (logo "JA", subtítulo) | `languages.<idioma>.brandSub` | texto bajo el nombre |
| Menú de navegación (arriba) | `navigation` | array de enlaces |
| Selector de idioma | `settings.languageLabels` / `languageNames` | |
| Botón de tema claro/oscuro | `languages.<idioma>.themeLabel` | aria-label |
| **HERO** (portada: nombre, título, botones) | `hero` | bloque `hero` |
| Insignias del hero (chips verdes) | `hero.badges` | |
| Botones del hero | `hero.buttons` | |
| **PERFIL PROFESIONAL** (texto + foto + datos) | `profile` | bloque `profile` |
| Foto de perfil | `profile.media` | imagen R2 |
| Lista de datos (Base, Idiomas…) | `profile.facts` | |
| Frase destacada (cita) | `profile.valueBlock` | |
| **ÁREAS DE ESPECIALIDAD** (8 tarjetas) | `expertise.cards` | bloques `expertisePreview` / `expertiseFull` |
| **MODELOS DE COLABORACIÓN** (2 tarjetas) | `collaboration.consulting` / `collaboration.payroll` | bloque `collaboration` |
| **DISPONIBILIDAD** (lista + pastillas) | `availability` | bloque `availability` |
| **RECURSOS** (CV, portafolio, prensa…) | `resources.items` | bloque `resources` |
| **PROYECTOS** (tarjetas clicables) | `projects` | bloque `projects` |
| Contenido del **MODAL** de un proyecto | `projects[n].extended` | párrafos, imágenes, keywords, video |
| **CLASIFICACIÓN IA** (sección + datos ATS) | `aiClassification` | bloque `aiClassification` |
| **BANDA CTA** ("¿Tu empresa necesita…?") | `ctaBand` | bloque `ctaBand` |
| Encabezados de /perfil y /contacto | `pageHeaders.perfil` / `pageHeaders.contacto` | |
| **FORMULARIO** de contacto (7 pasos) | `forms.opportunity.steps` | bloque `wizard` |
| **PIE DE PÁGINA** (tagline, copyright, enlaces) | `languages.<idioma>.footerTagline` / `footerCopy` + `navigation` + `links` | |
| Enlaces externos (CV, WhatsApp, LinkedIn…) | `links` | |
| Textos de botones/etiquetas de interfaz | `languages.<idioma>` | ver §12 |
| URLs de imágenes (Cloudflare R2) | `media.r2` | ver §10 |
| Datos estructurados SEO (Google) | `jsonld` | |
| Qué bloques tiene cada página | `routes` | ver §2 |

---

## 4. La cabecera y el pie de página

Son fijos en las 8 carcasas HTML, pero **sus textos salen del JSON**:

- **Subtítulo del logo** (junto a "Josueth Acevedo Cruz"): `languages.<idioma>.brandSub`
- **Menú superior**: `navigation` (mismo array para cabecera y pie).
- **Tagline del pie**: `languages.<idioma>.footerTagline`
- **Línea de copyright**: `languages.<idioma>.footerCopy` (el año se añade solo).
- **Enlaces del pie**: `navigation` + automáticamente LinkedIn y "La Prensa" desde `links`.

`navigation` es un array; cada elemento:

```json
{ "path": "/inicio", "label": { "es": "Inicio", "en": "Home", ... }, "visible": true }
```

Cambia `label` para renombrar, reordena el array para cambiar el orden, o pon
`"visible": false` para ocultar una entrada del menú.

---

## 5. El HERO (portada)

Clave `hero`:

```json
"hero": {
  "visible": true,
  "kicker":  { "es": "Disponible para nuevas oportunidades", ... },  // línea con punto verde
  "name":    "Josueth Acevedo Cruz",                                 // título grande
  "title":   { "es": "Marketing digital, <em>IA aplicada</em>...", ... },  // admite <em>
  "subtitle":{ "es": "Ayudo a empresas...", ... },
  "badges":  { "es": ["Disponible para consultoría", "..."], ... },  // chips (array por idioma)
  "buttons": [ ... ],                                                // ver abajo
  "ruleLabel": { "es": "Perfil híbrido · Estrategia · ...", ... }
}
```

**Botón del hero** (`hero.buttons[n]`):

```json
{
  "label": { "es": "Solicitar perfil profesional", "en": "...", ... },
  "href": "#/contacto",          // ruta interna (#/...) o URL externa
  "style": "primary",            // primary | outline | copper | ghost
  "external": false,             // true abre en pestaña nueva
  "visible": true
}
```

---

## 6. El PERFIL

Clave `profile`:

- `eyebrow`, `heading` → títulos de la sección.
- `paragraphs` → array de párrafos por idioma: `{ "es": ["p1","p2","p3"], "en": [...] }`.
- `valueBlock` → la frase destacada (cita).
- `facts` → lista de datos clave, array de pares por idioma:
  ```json
  "facts": { "es": [ { "k": "Base", "v": "Panamá" }, { "k": "Idiomas", "v": "ES · EN · ..." } ] }
  ```
- `media` → la foto (ver §9 para la estructura completa de imágenes).

---

## 7. Las TARJETAS (estructura de cada tipo)

El sitio usa cuatro tipos de tarjeta. Esta es la forma exacta de cada una:

### 7.1 Tarjeta de ESPECIALIDAD — `expertise.cards[n]`
Se numeran solas (01, 02…). Hay 8; se muestran 4 en inicio y las 8 en `/expertise`.

```json
{
  "visible": true,
  "title":       { "es": "Marketing digital y SEO", "en": "Digital marketing & SEO" },
  "description": { "es": "Estrategias de posicionamiento...", "en": "..." },
  "tools": ["SEO", "SEM", "GA4", "Content Strategy"]   // chips inferiores
}
```

### 7.2 Tarjeta de MODELO — `collaboration.consulting` y `collaboration.payroll`

```json
{
  "visible": true,
  "tag":   { "es": "Para empresas y agencias", "en": "..." },   // etiqueta superior
  "title": { "es": "Consultoría / Proyectos", "en": "..." },
  "intro": { "es": "Texto introductorio...", "en": "..." },
  "items": { "es": ["punto 1", "punto 2"], "en": [...] },       // lista con viñetas ✓
  "cta":   { "label": { "es": "Conversar...", "en": "..." }, "href": "#/contacto?tipo=consultor" }
}
```

### 7.3 Tarjeta de RECURSO — `resources.items[n]`

```json
{
  "visible": true,
  "icon": "↧",                                       // emoji/símbolo
  "title":       { "es": "Descargar CV", "en": "Download CV" },
  "description": { "es": "Currículum en PDF.", "en": "..." },
  "cta":         { "es": "Abrir CV", "en": "Open CV" },
  "linkRef": "cv",        // ← apunta a una clave de `links` (ver §11). Alternativa: "href": "https://..."
  "external": true        // abre en pestaña nueva
}
```

### 7.4 Tarjeta de PROYECTO — `projects[n]`
Es clicable y abre el modal. Estructura completa en §8.

---

## 8. Los PROYECTOS y su MODAL

Cada elemento de `projects` define la **tarjeta** (lo visible en `/proyectos`) y,
dentro de `extended`, el **contenido del modal** que se abre al hacer clic.

```json
{
  "id": "ai-business-adaptation",          // identificador único (sin espacios)
  "visible": true,
  "title":       { "es": "...", "en": "..." },
  "category":    { "es": "...", "en": "..." },   // etiqueta superior de la tarjeta
  "description": { "es": "...", "en": "..." },   // texto corto de la tarjeta
  "tags": ["IA", "Marketing Digital", "Diseño Web"],   // chips de la tarjeta
  "media": { "r2Path": "paginahv/projects/ai-business-adaptation/cover.png",
             "alt": { "es": "...", "en": "..." } },     // portada (ver §9)
  "projectUrl": "",                 // si tiene URL, aparece botón externo "Ver proyecto"
  "showProjectButton": true,
  "projectButtonLabel": { "es": "Ver proyecto", "en": "View project" },

  "extended": {                     // ← CONTENIDO DEL MODAL
    "paragraphs": {                 // 3 párrafos (recomendado) por idioma
      "es": ["Párrafo 1...", "Párrafo 2...", "Párrafo 3..."],
      "en": ["Paragraph 1...", "Paragraph 2...", "Paragraph 3..."]
    },
    "images": [                     // 2 imágenes internas (galería del modal)
      { "r2Path": "paginahv/projects/<id>/detail-1.png", "alt": { "es": "...", "en": "..." } },
      { "r2Path": "paginahv/projects/<id>/detail-2.png", "alt": { "es": "...", "en": "..." } }
    ],
    "keywords": ["IA aplicada", "Automatización", "..."],   // nube de pastillas
    "youtubeId": ""                 // ID de YouTube (11 caracteres) o "" para sin video
  }
}
```

- **Agregar un proyecto:** duplica un bloque entero, cambia `id` y los textos.
  La tarjeta y el modal se generan solos en los 8 idiomas.
- **Ocultar un proyecto:** `"visible": false`.
- **Video del modal:** pon el ID en `extended.youtubeId` (los 11 caracteres tras
  `watch?v=`). Si está vacío, el modal no muestra hueco de video. Ver §9.

**Encabezado de la sección** (el título "Proyectos y casos de uso" sobre las tarjetas)
está aparte, en `projectsSection` (`eyebrow`, `heading`, `lead`). Lo mismo aplica a
las cabeceras de otras secciones: `expertise.eyebrow/heading/lead`,
`availability.eyebrow/heading`, `resources.eyebrow/heading/lead`, etc.

---

## 9. IMÁGENES (estructura y Cloudflare R2)

Cualquier objeto `media` (foto de perfil, portadas, imágenes del modal) acepta:

```json
{
  "r2Path": "paginahv/mi-imagen.png",        // ruta dentro del bucket R2 (recomendado)
  "src": "",                                  // o URL completa / ruta local explícita
  "localSrc": "img/me.png",                   // respaldo local opcional
  "alt":     { "es": "...", "en": "..." },    // texto alternativo POR IDIOMA (importante para SEO)
  "title":   { "es": "...", "en": "..." },
  "caption": { "es": "...", "en": "..." },
  "width": 1200, "height": 800, "loading": "lazy",
  "placeholder": { "enabled": true, "seoText": "texto indexable si no hay imagen" }
}
```

**Cadena de carga automática** (si una falla, prueba la siguiente, sin tocar nada):

```
1. dominio personalizado R2   (media.r2.primaryBaseUrl + r2Path)
2. dominio público r2.dev      (media.r2.altBaseUrl + r2Path)
3. placeholder de R2           (media.r2.placeholderPath, en ambos dominios)
4. archivo local               (localSrc o media.localPlaceholder)
5. placeholder SEO en HTML      (caja accesible e indexable, sin imagen)
```

---

## 10. Cambiar las URLs de Cloudflare R2

Bloque `media.r2`:

```json
"media": {
  "r2": {
    "primaryBaseUrl": "https://media.josuethacevedo.com",   // tu dominio personalizado
    "altBaseUrl": "https://pub-CAMBIA-ESTE-ID.r2.dev",      // URL pública del bucket
    "placeholderPath": "paginahv/me.png"
  },
  "localPlaceholder": "img/me.png"
}
```

Sustituye los dos `BaseUrl` por los de tu bucket. Mientras `altBaseUrl` contenga
la palabra `CAMBIA`, ese dominio se ignora (evita peticiones rotas).
**Nunca** pongas aquí tokens ni claves secretas: solo URLs públicas de lectura.

---

## 11. Enlaces externos — `links`

Lista central de URLs reutilizables. Las tarjetas de recurso y los botones las
referencian con `"linkRef": "<clave>"` en lugar de repetir la URL.

```json
"links": {
  "cv": "https://...",            "portfolioOnline": "https://...",
  "portfolioDownload": "https://...", "whatsapp": "https://wa.me/50765164741",
  "email": "mailto:...",          "emailAddress": "josueth.acevedo@gmail.com",
  "linkedin": "https://...",      "pressArticle": "https://..."
}
```

Cambia una URL aquí y se actualiza en todos los sitios que la usan.

---

## 12. Textos de interfaz — `languages.<idioma>`

Botones y etiquetas que no pertenecen a una sección concreta. Cada idioma tiene
su paquete. Claves disponibles:

```
brandSub, skipLink, menuOpen, menuClose, themeLabel, langLabel,
footerTagline, footerCopy, viewProject, placeholderLabel, stepOf, next, back,
sendWhatsApp, sendEmail, copySummary, copied, requiredField, selectOne,
invalidEmail, addResponsibility, removeResponsibility, summaryTitle, rangeEstimated,
projectDetails, closeModal, aboutProject, keywordCloud, projectGallery, projectVideo, loadError
```

Las 7 últimas (`projectDetails` … `loadError`) controlan los textos del **modal de
proyectos** y los mensajes de error, en los 8 idiomas.

**Textos de respaldo** (`fallbacks`): si una imagen no trae `alt`/`title`, o un botón
no trae etiqueta, se usan los valores genéricos de `fallbacks.images` y
`fallbacks.buttons` (y `fallbacks.seo.defaultDescription` para descripciones SEO).
Rara vez hay que tocarlos; existen para que nunca quede un `alt` vacío.

**El formulario de contacto** (7 pasos: tipo de oportunidad, datos de empresa,
industria, responsabilidades, perfil deseado, compensación, mensaje) vive en
`forms.opportunity.steps.step1`…`step7`. Cada paso trae sus propios `title`,
`question`, `options`, `fields`, etc. El paso 6 incluye el rango de compensación
(`min`, `max`, `step`, `currencies`).

---

## 13. Probar localmente

El contenido se carga con `fetch()`, que **no funciona con doble clic** (`file://`).
Usa un servidor local desde la raíz del proyecto:

```bash
python -m http.server 8000        # → http://localhost:8000/es/
# o, si tienes Node (solo desarrollo, no es requisito del sitio):
npx serve .
```

---

## 14. Desplegar en hosting estático

Sube el proyecto completo, sin build:

- **GitHub Pages:** push a la rama configurada (`.nojekyll` ya incluido). Funciona
  también en Pages de proyecto (subdirectorio): las rutas internas son relativas.
- **Cloudflare Pages:** framework "None", comando de build vacío, directorio `/`.
- **Netlify / Vercel / cualquier CDN:** carpeta raíz como directorio de publicación.

Requisitos del servidor: ninguno. Solo que `data/site-content.json` se sirva con el
sitio (mismo origen).

---

## 15. Crear un idioma nuevo

1. En `settings`: añade el código a `availableLanguages` y entradas en
   `languageLabels`, `languageNames`, `languageHtmlCodes`, `languagePaths`
   (y `rtlLanguages` si se escribe de derecha a izquierda, como el árabe).
2. En `languages`: copia el paquete de `es` y traduce sus claves.
3. Añade ese idioma a los textos de contenido donde quieras (lo que falte usa
   el respaldo es/en).
4. Crea la carpeta `/xx/` copiando `es/index.html`; ajusta `lang`, `data-lang`,
   `<title>`, metadescripciones, `canonical` y Open Graph. Agrega el `hreflang`
   del nuevo idioma en las 8 carcasas y en el redirector raíz (`index.html`,
   arrays `supported` y `paths`).

---

### Notas finales

- SEO: cada carcasa conserva su `canonical`, `hreflang`, Open Graph y JSON-LD
  originales; el motor inyecta además JSON-LD dinámico por idioma desde `jsonld`.
- Conviene revisar/humanizar las traducciones largas antes de publicar.
- `/archive/` no está enlazado desde ninguna página; puedes borrarlo cuando quieras.
