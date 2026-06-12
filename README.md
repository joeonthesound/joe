# Josueth Acevedo — versión multiidioma

Estructura generada:

- `/index.html` detecta idioma del navegador/preferencia y redirige.
- `/es/index.html` Español.
- `/br/index.html` Portugués Brasil. Nota: la URL usa `/br/`, pero `hreflang` correcto es `pt-BR`.
- `/en/index.html` Inglés.
- `/fr/index.html` Francés.
- `/de/index.html` Alemán.
- `/ar/index.html` Árabe con `dir="rtl"`.
- `/zh/index.html` Chino simplificado con `hreflang="zh-Hans"`.
- `/ja/index.html` Japonés.

Cada página incluye canonical y alternates hreflang hacia las demás versiones.

Importante: la arquitectura multiidioma ya está lista. Para SEO internacional óptimo, conviene revisar/humanizar todas las traducciones del contenido largo antes de publicar.
