/**
 * ajax.js
 * Cliente AJAX con XMLHttpRequest asíncrono.
 *
 * Se usa XMLHttpRequest y no fetch() porque el enunciado pide mostrar en todo
 * momento el estado de la petición: XHR notifica cada cambio de readyState
 * (0 → 4) mediante onreadystatechange, mientras que fetch() solo expone una
 * promesa que se resuelve al recibir las cabeceras.
 *
 * Requisitos del enunciado y dónde se resuelven:
 *   1. URL de la propia página por defecto ...... iniciar()
 *   2. Descargar y mostrar el contenido ......... cargarContenidos(), mostrarContenido()
 *   3. Estado de la petición en todo momento .... registrarEstado()
 *   4. Todas las cabeceras de la respuesta ...... mostrarCabeceras()
 *   5. Código y texto de la respuesta ........... mostrarCodigo()
 */
(function () {
  'use strict';

  // Valores de readyState según el estándar XMLHttpRequest de WHATWG.
  const ESTADOS = [
    { nombre: 'No inicializada', constante: 'UNSENT', detalle: 'objeto creado, aún sin open()' },
    { nombre: 'Cargando', constante: 'OPENED', detalle: 'open() configuró la petición; send() la envía' },
    { nombre: 'Cargada', constante: 'HEADERS_RECEIVED', detalle: 'llegaron la línea de estado y las cabeceras' },
    { nombre: 'Interactiva', constante: 'LOADING', detalle: 'se está recibiendo el cuerpo' },
    { nombre: 'Completada', constante: 'DONE', detalle: 'la transferencia terminó' },
  ];

  // Frases de estado de RFC 9110. HTTP/2 y HTTP/3 no transmiten la frase,
  // así que en esos casos xhr.statusText llega vacío y se usa esta tabla.
  const FRASES = {
    200: 'OK', 201: 'Created', 202: 'Accepted', 204: 'No Content', 206: 'Partial Content',
    301: 'Moved Permanently', 302: 'Found', 303: 'See Other', 304: 'Not Modified',
    307: 'Temporary Redirect', 308: 'Permanent Redirect',
    400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found',
    405: 'Method Not Allowed', 408: 'Request Timeout', 410: 'Gone', 429: 'Too Many Requests',
    500: 'Internal Server Error', 502: 'Bad Gateway', 503: 'Service Unavailable', 504: 'Gateway Timeout',
  };
  const CLASES = {
    1: 'Respuesta informativa', 2: 'Éxito', 3: 'Redirección',
    4: 'Error del cliente', 5: 'Error del servidor',
  };

  const TIEMPO_MAXIMO_MS = 15000;
  const LIMITE_VISTA = 200000; // caracteres mostrados como máximo para no bloquear la página

  let peticionActual = null;
  let inicio = 0;

  const $ = (id) => document.getElementById(id);
  const ms = () => `+${(performance.now() - inicio).toFixed(1).replace('.', ',')} ms`;

  /* ---------------- Utilidades de presentación ---------------- */

  function formatoBytes(n) {
    if (n < 1024) return `${n} B`;
    if (n < 1048576) return `${(n / 1024).toFixed(1).replace('.', ',')} KB`;
    return `${(n / 1048576).toFixed(2).replace('.', ',')} MB`;
  }

  function anotar(texto, esError = false) {
    const fila = document.createElement('li');
    const hora = document.createElement('time');
    hora.textContent = ms();
    const mensaje = document.createElement('span');
    mensaje.textContent = texto;
    if (esError) mensaje.className = 'err';
    fila.append(hora, mensaje);
    const bitacora = $('bitacora');
    bitacora.append(fila);
    bitacora.scrollTop = bitacora.scrollHeight; // sin mover la página
  }

  function textoVacio(contenedor, texto) {
    const p = document.createElement('p');
    p.className = 'vacio';
    p.textContent = texto;
    contenedor.replaceChildren(p);
  }

  /* ---------------- Requisito 3: estados de la petición ---------------- */

  function registrarEstado(estado) {
    const info = ESTADOS[estado];
    const actual = $('estado-actual');
    actual.textContent = `Estado ${estado}: ${info.nombre}`;
    actual.className = 'estado-actual' + (estado === 4 ? ' listo' : '');

    for (const paso of $('pista').children) {
      const n = Number(paso.dataset.estado);
      paso.classList.toggle('actual', n === estado);
      paso.classList.toggle('listo', n === estado && estado === 4);
      if (n === estado) {
        paso.classList.add('alcanzado');
        paso.querySelector('.tiempo').textContent = ms();
      }
    }
    anotar(`readyState ${estado} ${info.constante}: ${info.detalle}`);
  }

  function reiniciarPista() {
    for (const paso of $('pista').children) {
      paso.className = '';
      paso.querySelector('.tiempo').textContent = '';
    }
    $('bitacora').replaceChildren();
  }

  function marcarFallo(texto) {
    const actual = $('estado-actual');
    actual.textContent = texto;
    actual.className = 'estado-actual fallo';
    const ultimo = $('pista').querySelector('li.actual');
    if (ultimo) {
      ultimo.classList.remove('listo');
      ultimo.classList.add('fallo');
    }
  }

  /* ---------------- Requisito 5: código de estado ---------------- */

  function mostrarCodigo(xhr) {
    const caja = $('codigo');
    const codigo = xhr.status;
    const frase = xhr.statusText || FRASES[codigo] || '';
    const procedencia = xhr.statusText
      ? 'Texto enviado por el servidor (xhr.statusText).'
      : 'El servidor no envió texto de estado (HTTP/2 o superior); se muestra la frase estándar de RFC 9110.';

    const cifra = document.createElement('div');
    cifra.className = 'cifra';
    cifra.textContent = codigo;
    const textoFrase = document.createElement('div');
    textoFrase.className = 'frase';
    textoFrase.textContent = frase;
    const clase = document.createElement('p');
    clase.className = 'clase';
    clase.textContent = `${CLASES[Math.floor(codigo / 100)] || 'Desconocido'}. ${procedencia}`;

    caja.className = `codigo c${Math.floor(codigo / 100)}`;
    caja.replaceChildren(cifra, textoFrase, clase);
  }

  /* ---------------- Requisito 4: cabeceras de la respuesta ---------------- */

  function mostrarCabeceras(xhr, url) {
    const caja = $('cabeceras');
    const crudo = xhr.getAllResponseHeaders(); // líneas «nombre: valor» separadas por CRLF
    const lineas = crudo.trim().split(/[\r\n]+/).filter(Boolean);

    if (lineas.length === 0) {
      textoVacio(caja, 'El servidor no expuso ninguna cabecera.');
      return;
    }

    const tabla = document.createElement('table');
    tabla.className = 'tabla-cabeceras';
    const cuerpo = document.createElement('tbody');
    for (const linea of lineas) {
      const i = linea.indexOf(':');
      const fila = document.createElement('tr');
      const nombre = document.createElement('th');
      nombre.scope = 'row';
      nombre.textContent = linea.slice(0, i).trim();
      const valor = document.createElement('td');
      valor.textContent = linea.slice(i + 1).trim();
      fila.append(nombre, valor);
      cuerpo.append(fila);
    }
    tabla.append(cuerpo);
    const envoltura = document.createElement('div');
    envoltura.className = 'tabla-scroll';
    envoltura.append(tabla);

    const detalles = document.createElement('details');
    detalles.className = 'crudo';
    const resumen = document.createElement('summary');
    resumen.textContent = 'Ver texto original de getAllResponseHeaders()';
    const pre = document.createElement('pre');
    pre.textContent = crudo;
    detalles.append(resumen, pre);

    const nodos = [envoltura, detalles];
    if (url.origin !== window.location.origin) {
      const nota = document.createElement('p');
      nota.className = 'cabeceras-nota';
      nota.textContent = 'Petición a otro origen: el navegador solo expone las cabeceras permitidas por CORS (las básicas y las listadas en Access-Control-Expose-Headers).';
      nodos.push(nota);
    }
    caja.replaceChildren(...nodos);
    anotar(`Cabeceras recibidas: ${lineas.length}`);
  }

  /* ---------------- Requisito 2: contenido del recurso ---------------- */

  function mostrarContenido(xhr, final) {
    const destino = $('contenidos');
    const texto = xhr.responseText;
    destino.className = 'contenidos';
    destino.textContent = texto.length > LIMITE_VISTA
      ? `${texto.slice(0, LIMITE_VISTA)}\n\n[… se muestran ${LIMITE_VISTA.toLocaleString('es')} de ${texto.length.toLocaleString('es')} caracteres]`
      : texto;
    if (!texto.length && final) textoVacio(destino, 'La respuesta no tiene cuerpo.');

    if (final) {
      const bytes = new TextEncoder().encode(texto).length;
      const tipo = xhr.getResponseHeader('Content-Type') || 'tipo no indicado';
      const lineas = texto ? texto.split('\n').length : 0;
      $('meta-contenido').textContent = `${tipo}, ${formatoBytes(bytes)}, ${lineas.toLocaleString('es')} líneas`;
    }
  }

  function mostrarErrorRed(motivo, url) {
    const destino = $('contenidos');
    destino.className = 'contenidos error-red';
    const otroOrigen = url.origin !== window.location.origin;
    destino.textContent = {
      red: window.location.protocol === 'file:'
        ? 'El navegador bloquea las peticiones AJAX hechas desde una página abierta como archivo (file://). Sirve la carpeta por HTTP y vuelve a intentarlo.'
        : otroOrigen
        ? `No se recibió respuesta legible. Lo más probable es que ${url.origin} no permita peticiones desde ${window.location.origin} (falta la cabecera Access-Control-Allow-Origin, política CORS). También puede ser un fallo de red o de DNS. El navegador no da más detalle a JavaScript por seguridad; la consola de desarrollo muestra la causa exacta.`
        : 'No se recibió respuesta. Revisa la conexión o que el servidor esté en marcha.',
      tiempo: `El servidor no respondió en ${TIEMPO_MAXIMO_MS / 1000} s y la petición se canceló (xhr.timeout).`,
      cancelada: 'La petición se canceló antes de terminar.',
    }[motivo];

    const caja = $('codigo');
    caja.className = 'codigo c0';
    const cifra = document.createElement('div');
    cifra.className = 'cifra';
    cifra.textContent = '0';
    const clase = document.createElement('p');
    clase.className = 'clase';
    clase.textContent = 'xhr.status vale 0: no hubo respuesta HTTP que mostrar.';
    caja.replaceChildren(cifra, clase);
    textoVacio($('cabeceras'), 'Sin cabeceras: no llegó respuesta.');
    $('meta-contenido').textContent = '';
  }

  /* ---------------- Petición ---------------- */

  function cargarContenidos(valor) {
    const error = $('error-recurso');
    const campo = $('recurso');
    let url;
    try {
      url = new URL(valor.trim(), window.location.href); // admite rutas relativas
    } catch {
      url = null;
    }
    if (!url || (!/^https?:$/.test(url.protocol) && url.protocol !== 'file:')) {
      error.textContent = 'Escribe una URL http(s) o una ruta relativa, por ejemplo datos/servidor.json.';
      campo.setAttribute('aria-invalid', 'true');
      return;
    }
    error.textContent = '';
    campo.removeAttribute('aria-invalid');

    // Si había una petición en curso se cancela; sus eventos se ignoran.
    if (peticionActual) {
      const anterior = peticionActual;
      peticionActual = null;
      anterior.abort();
    }

    reiniciarPista();
    textoVacio($('cabeceras'), 'Esperando la respuesta…');
    textoVacio($('codigo'), 'Esperando la respuesta…');
    $('codigo').className = 'codigo';
    $('contenidos').replaceChildren();
    $('meta-contenido').textContent = '';

    const xhr = new XMLHttpRequest();
    peticionActual = xhr;
    let motivoFallo = null;
    const vigente = () => xhr === peticionActual;
    inicio = performance.now();

    registrarEstado(xhr.readyState); // 0: el evento no se dispara para el estado inicial

    xhr.onreadystatechange = () => {
      if (!vigente()) return;
      registrarEstado(xhr.readyState);
      if (xhr.readyState === XMLHttpRequest.HEADERS_RECEIVED) {
        // Código y cabeceras están disponibles antes de que llegue el cuerpo.
        mostrarCodigo(xhr);
        mostrarCabeceras(xhr, url);
      }
    };
    xhr.onprogress = (e) => {
      if (!vigente()) return;
      anotar(`progress: ${formatoBytes(e.loaded)}${e.lengthComputable ? ` de ${formatoBytes(e.total)}` : ''}`);
      mostrarContenido(xhr, false); // vista parcial mientras se descarga
    };
    xhr.onerror = () => { motivoFallo = 'red'; };
    xhr.ontimeout = () => { motivoFallo = 'tiempo'; };
    xhr.onabort = () => { motivoFallo = 'cancelada'; };
    xhr.onloadend = () => {
      if (!vigente()) return;
      peticionActual = null;
      $('enviar').disabled = false;
      if (motivoFallo) {
        anotar(`${motivoFallo === 'red' ? 'error' : motivoFallo === 'tiempo' ? 'timeout' : 'abort'}: la petición terminó sin respuesta`, true);
        marcarFallo(motivoFallo === 'tiempo' ? 'Tiempo agotado' : 'Error de red o CORS');
        mostrarErrorRed(motivoFallo, url);
        return;
      }
      mostrarContenido(xhr, true);
      anotar(`load: ${xhr.status} recibido en ${(performance.now() - inicio).toFixed(1).replace('.', ',')} ms`);
    };

    xhr.open('GET', url.href, true); // true = asíncrona; no bloquea la interfaz
    xhr.timeout = TIEMPO_MAXIMO_MS;
    $('enviar').disabled = true;
    anotar(`send(): GET ${url.href}`);
    xhr.send(null);
  }

  /* ---------------- Requisito 1: URL por defecto ---------------- */

  function iniciar() {
    const campo = $('recurso');
    campo.value = window.location.href;

    if (window.location.protocol === 'file:') $('aviso-file').hidden = false;

    $('formulario-ajax').addEventListener('submit', (e) => {
      e.preventDefault();
      cargarContenidos(campo.value);
    });

    document.querySelectorAll('button.ejemplo[data-recurso]').forEach((boton) => {
      boton.addEventListener('click', () => {
        const destino = boton.dataset.recurso
          ? new URL(boton.dataset.recurso, window.location.href)
          : new URL(window.location.href);
        campo.value = destino.href;
        cargarContenidos(campo.value);
      });
    });

    registrarEstadoInicial();
  }

  function registrarEstadoInicial() {
    const paso = $('pista').querySelector('[data-estado="0"]');
    paso.classList.add('alcanzado', 'actual');
    $('estado-actual').textContent = 'No iniciada';
  }

  document.addEventListener('DOMContentLoaded', iniciar);
})();
