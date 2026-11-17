/**
 * ui.js
 * Conecta la lógica de js/ejercicios.js con la página. Todo el texto que
 * proviene del usuario se inserta con textContent (nunca con innerHTML),
 * así una entrada como <img onerror=…> se muestra literalmente y no se ejecuta.
 */
(function () {
  'use strict';

  const E = window.Ejercicios;
  const $ = (id) => document.getElementById(id);

  // Crea un elemento con clase y texto opcionales.
  function el(etiqueta, clase, texto) {
    const nodo = document.createElement(etiqueta);
    if (clase) nodo.className = clase;
    if (texto !== undefined) nodo.textContent = texto;
    return nodo;
  }

  function veredicto(tipo, texto) {
    return el('p', `veredicto ${tipo}`, texto);
  }

  function pintar(salida, ...nodos) {
    salida.replaceChildren(...nodos);
  }

  /* ---------------- Ejercicio 1: palíndromo ---------------- */
  function resolverPalindromo() {
    const entrada = $('texto-palindromo');
    const salida = $('salida-palindromo');
    const r = E.analizarPalindromo(entrada.value);

    if (!r.valido) {
      entrada.setAttribute('aria-invalid', 'true');
      pintar(salida, veredicto('aviso', r.error));
      return;
    }
    entrada.removeAttribute('aria-invalid');

    const letras = el('div', 'letras');
    letras.setAttribute('aria-hidden', 'true');
    const caracteres = Array.from(r.normalizado);
    const limite = r.esPalindromo ? Infinity : r.diferencia.izquierda;
    caracteres.forEach((c, i) => {
      const espejo = caracteres.length - 1 - i;
      const span = el('span', '', c);
      if (!r.esPalindromo && (i === r.diferencia.izquierda || i === r.diferencia.derecha)) {
        span.className = 'choque';
      } else if (Math.min(i, espejo) < limite && i !== espejo) {
        span.className = 'espejo';
      }
      letras.append(span);
    });

    const texto = r.esPalindromo
      ? `Sí es un palíndromo`
      : `No es un palíndromo`;
    const detalle = r.esPalindromo
      ? `Se compararon ${r.comparaciones} pares de extremos y todos coinciden.`
      : `Falla en el par ${r.comparaciones}: «${caracteres[r.diferencia.izquierda]}» (posición ${r.diferencia.izquierda + 1}) frente a «${caracteres[r.diferencia.derecha]}» (posición ${r.diferencia.derecha + 1}).`;

    pintar(salida,
      veredicto(r.esPalindromo ? 'si' : 'no', texto),
      letras,
      el('p', 'detalle', detalle));
  }

  /* ---------------- Ejercicio 2: mayor de dos ---------------- */
  function resolverMayor() {
    const campos = { primero: $('numero-1'), segundo: $('numero-2') };
    const errores = { primero: $('error-numero-1'), segundo: $('error-numero-2') };
    const salida = $('salida-mayor');
    const r = E.mayorDeDos(campos.primero.value, campos.segundo.value);

    for (const clave of ['primero', 'segundo']) {
      const mensaje = r.valido ? '' : r.errores[clave] || '';
      errores[clave].textContent = mensaje;
      if (mensaje) campos[clave].setAttribute('aria-invalid', 'true');
      else campos[clave].removeAttribute('aria-invalid');
    }
    if (!r.valido) {
      pintar(salida);
      (r.errores.primero ? campos.primero : campos.segundo).focus();
      return;
    }

    const tarjeta = (titulo, valor, gana) => {
      const caja = el('div', gana ? 'valor gana' : 'valor');
      caja.append(el('small', '', titulo), el('strong', '', valor));
      return caja;
    };
    const signo = r.orden === 0 ? '=' : r.orden > 0 ? '>' : '<';
    const comparacion = el('div', 'comparacion');
    comparacion.append(
      tarjeta('Primer número', r.a, r.mayor === 'primero'),
      el('span', 'signo', signo),
      tarjeta('Segundo número', r.b, r.mayor === 'segundo'));

    const texto = r.mayor === null
      ? 'Los dos números son iguales'
      : `El mayor es ${r.mayor === 'primero' ? r.a : r.b}`;
    pintar(salida, veredicto(r.mayor === null ? 'neutro' : 'si', texto), comparacion);
  }

  /* ---------------- Ejercicio 3: vocales presentes ---------------- */
  function resolverVocales() {
    const entrada = $('texto-vocales');
    const salida = $('salida-vocales');
    if (!entrada.value.trim()) {
      pintar(salida, veredicto('aviso', 'Escribe una frase.'));
      return;
    }
    const vocales = E.vocalesPresentes(entrada.value);
    if (vocales.length === 0) {
      pintar(salida, veredicto('no', 'La frase no tiene vocales'));
      return;
    }

    const lista = el('ul', 'fichas');
    for (const { vocal, formas } of vocales) {
      const ficha = el('li', '', vocal);
      if (formas.length) ficha.append(el('small', '', `(${formas.join(', ')})`));
      lista.append(ficha);
    }
    const faltan = E.VOCALES.filter((v) => !vocales.some((x) => x.vocal === v));
    pintar(salida,
      veredicto('si', `Aparecen ${vocales.length} de las 5 vocales`),
      lista,
      el('p', 'detalle', faltan.length
        ? `En orden de primera aparición. No aparecen: ${faltan.join(', ')}.`
        : 'En orden de primera aparición. Están todas.'));
  }

  /* ---------------- Ejercicio 4: conteo de vocales ---------------- */
  function resolverConteo() {
    const entrada = $('texto-conteo');
    const salida = $('salida-conteo');
    if (!entrada.value.trim()) {
      pintar(salida, veredicto('aviso', 'Escribe una frase.'));
      return;
    }
    const { conteo, total, letras } = E.contarVocales(entrada.value);
    const maximo = Math.max(1, ...Object.values(conteo));

    const barras = el('dl', 'barras');
    const anchos = [];
    for (const vocal of E.VOCALES) {
      const fila = el('div', conteo[vocal] === 0 ? 'barra cero' : 'barra');
      const pista = el('dd', 'tramo');
      const relleno = el('span');
      pista.append(relleno);
      pista.setAttribute('aria-hidden', 'true');
      const cuenta = el('dd', 'cuenta', String(conteo[vocal]));
      cuenta.setAttribute('aria-label', `${conteo[vocal]} ${conteo[vocal] === 1 ? 'vez' : 'veces'}`);
      fila.append(el('dt', '', vocal), pista, cuenta);
      barras.append(fila);
      anchos.push([relleno, (conteo[vocal] / maximo) * 100]);
    }

    pintar(salida,
      veredicto(total ? 'si' : 'no', total ? `${total} ${total === 1 ? 'vocal' : 'vocales'} en total` : 'La frase no tiene vocales'),
      barras,
      el('p', 'detalle', letras ? `${total} de ${letras} letras son vocales (${Math.round((total / letras) * 100)} %).` : 'La frase no contiene letras.'));

    // El ancho se fija en el siguiente fotograma para que la transición se vea.
    requestAnimationFrame(() => anchos.forEach(([nodo, ancho]) => { nodo.style.width = `${ancho}%`; }));
  }

  /* ---------------- Enlace de eventos ---------------- */
  function alEnviar(idFormulario, resolver) {
    $(idFormulario).addEventListener('submit', (evento) => {
      evento.preventDefault();
      resolver();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    alEnviar('form-palindromo', resolverPalindromo);
    alEnviar('form-mayor', resolverMayor);
    alEnviar('form-vocales', resolverVocales);
    alEnviar('form-conteo', resolverConteo);

    // Botones de ejemplo: rellenan el campo y envían su formulario.
    document.querySelectorAll('button.ejemplo[data-destino]').forEach((boton) => {
      boton.addEventListener('click', () => {
        const campo = $(boton.dataset.destino);
        campo.value = boton.textContent;
        campo.form.requestSubmit();
      });
    });
    document.querySelectorAll('button.ejemplo[data-par]').forEach((boton) => {
      boton.addEventListener('click', () => {
        const [a, b] = boton.dataset.par.split('|');
        $('numero-1').value = a;
        $('numero-2').value = b;
        $('form-mayor').requestSubmit();
      });
    });
  });
})();
