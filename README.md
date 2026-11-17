# Laboratorio de JavaScript y AJAX

Desarrollo de Aplicaciones en Red. Página estática con HTML, CSS y JavaScript sin dependencias ni paso de compilación.

## Estructura

```
index.html              Página única: cuatro ejercicios JS y el cliente AJAX
css/estilos.css         Estilos (modo claro y oscuro, adaptable a móvil)
js/ejercicios.js        Lógica pura de los ejercicios 1 a 4 (sin DOM, probada con node:test)
js/ui.js                Conexión de los ejercicios con la página
js/ajax.js              Cliente AJAX con XMLHttpRequest
datos/servidor.json     Recurso de prueba del mismo origen
tests/ejercicios.test.js  Pruebas unitarias
```

## Ejecutar en local

Los ejercicios de JavaScript funcionan abriendo `index.html` con doble clic. La parte AJAX necesita un servidor HTTP, porque los navegadores bloquean las peticiones desde `file://`:

```bash
python -m http.server 8000      # o: npx serve .
# abrir http://localhost:8000
```

## Pruebas

Requiere Node.js 18 o superior:

```bash
node --test
```

## Publicar la página

Es un sitio estático: sirve cualquier hosting gratuito. Dos opciones:

### Opción A: GitHub Pages

1. Crea un repositorio público en GitHub (por ejemplo `laboratorio-js-ajax`) y sube el contenido de esta carpeta a la rama `main`.
2. En el repositorio: **Settings → Pages → Build and deployment**, origen **Deploy from a branch**, rama `main`, carpeta `/ (root)`. Guarda.
3. En uno o dos minutos la página queda en `https://<tu-usuario>.github.io/laboratorio-js-ajax/`.

El archivo `.nojekyll` evita que GitHub procese el sitio con Jekyll.

### Opción B: Render (Static Site)

1. Sube la carpeta a un repositorio de GitHub.
2. En Render: **New → Static Site**, conecta el repositorio.
3. Deja vacío el *Build Command* y pon `.` como *Publish Directory*. Crea el sitio.
4. La página queda en `https://<nombre>.onrender.com`.

Netlify y Vercel funcionan igual: arrastrar la carpeta o conectar el repositorio, sin comando de compilación.

## Comprobación rápida tras publicar

- Palíndromo: «Anilina» → sí es palíndromo.
- Mayor: 5 y 6 → el mayor es 6.
- Vocales: «casa casino» → a, i, o.
- Conteo: «casa casino» → a 3, e 0, i 1, o 1, u 0.
- AJAX: el campo muestra la URL publicada; «Mostrar contenidos» debe dar 200 y recorrer los estados 0 a 4.
