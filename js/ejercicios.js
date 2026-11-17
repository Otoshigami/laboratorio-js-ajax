/**
 * ejercicios.js
 * Lógica pura de los ejercicios de JavaScript (sin acceso al DOM).
 *
 * Se mantiene separada de la interfaz para poder probarla de forma aislada
 * (ver tests/ejercicios.test.js, que se ejecuta con `node --test`).
 * Funciona como script clásico en el navegador (expone window.Ejercicios),
 * así la página también funciona abierta con doble clic, y como módulo
 * CommonJS en Node.js.
 */
(function (global) {
  'use strict';

  const VOCALES = ['a', 'e', 'i', 'o', 'u'];

  /**
   * Pliega el texto para compararlo: minúsculas y sin tildes ni diéresis.
   * Se descompone en forma NFD (letra base + marca diacrítica), se eliminan
   * las marcas salvo la virgulilla de la «ñ», que en español es otra letra,
   * y se vuelve a componer en NFC.
   */
  function plegar(texto) {
    return String(texto)
      .normalize('NFD')
      .replace(/(?<![nN])\p{Mn}+/gu, '')
      .normalize('NFC')
      .toLocaleLowerCase('es');
  }

  // Memoriza la vocal base de cada carácter ya visto (á → a, Ü → u, b → null).
  const cacheVocal = new Map();
  function vocalBase(caracter) {
    if (!cacheVocal.has(caracter)) {
      const base = plegar(caracter);
      cacheVocal.set(caracter, VOCALES.includes(base) ? base : null);
    }
    return cacheVocal.get(caracter);
  }

  /* ------------------------------------------------------------------ */
  /* Ejercicio 1. Palíndromo                                             */
  /* ------------------------------------------------------------------ */

  /**
   * Determina si un texto es palíndromo ignorando mayúsculas, tildes,
   * espacios y signos de puntuación. Recorre la cadena con dos índices que
   * avanzan desde los extremos: O(n) en tiempo, se detiene en la primera
   * diferencia y la devuelve para poder señalarla en la interfaz.
   */
  function analizarPalindromo(texto) {
    // Array.from recorre por puntos de código, no por unidades UTF-16.
    const letras = Array.from(plegar(texto ?? '')).filter((c) => /[\p{L}\p{N}]/u.test(c));

    if (letras.length === 0) {
      return { valido: false, error: 'Escribe al menos una letra o un número.' };
    }

    let i = 0;
    let j = letras.length - 1;
    let comparaciones = 0;
    while (i < j) {
      comparaciones++;
      if (letras[i] !== letras[j]) {
        return {
          valido: true,
          esPalindromo: false,
          normalizado: letras.join(''),
          diferencia: { izquierda: i, derecha: j },
          comparaciones,
        };
      }
      i++;
      j--;
    }
    return { valido: true, esPalindromo: true, normalizado: letras.join(''), comparaciones };
  }

  /* ------------------------------------------------------------------ */
  /* Ejercicio 2. Mayor de dos números                                   */
  /* ------------------------------------------------------------------ */

  const PATRON_NUMERO = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;

  /**
   * Valida la entrada del usuario. Admite coma o punto decimal y notación
   * científica. Rechaza lo que Number() o parseFloat() aceptarían en silencio:
   * cadena vacía (Number('') === 0) o texto con basura (parseFloat('12abc') === 12).
   */
  function interpretarNumero(entrada) {
    const original = String(entrada ?? '').trim();
    let texto = original.replace(/\s+/g, '');
    if (texto === '') return { ok: false, error: 'Falta el número.' };

    if (texto.includes(',')) {
      if (texto.includes('.') || texto.split(',').length > 2) {
        return { ok: false, error: 'Usa un solo separador decimal, sin separadores de miles.' };
      }
      texto = texto.replace(',', '.');
    }
    if (!PATRON_NUMERO.test(texto)) {
      return { ok: false, error: `«${original}» no es un número.` };
    }
    const valor = Number(texto);
    if (!Number.isFinite(valor)) {
      return { ok: false, error: 'El número supera el rango que JavaScript puede representar.' };
    }
    return { ok: true, texto, valor };
  }

  // Descompone un decimal sin exponente en signo, parte entera y fraccionaria.
  function partesDecimal(texto) {
    let negativo = texto.startsWith('-');
    const [entera = '', fraccion = ''] = texto.replace(/^[+-]/, '').split('.');
    const e = entera.replace(/^0+/, '');
    const f = fraccion.replace(/0+$/, '');
    if (e === '' && f === '') negativo = false; // -0 es igual a 0
    return { negativo, entera: e, fraccion: f };
  }

  // Compara magnitudes dígito a dígito: exacto con cualquier cantidad de cifras.
  function compararMagnitud(x, y) {
    if (x.entera.length !== y.entera.length) return x.entera.length > y.entera.length ? 1 : -1;
    if (x.entera !== y.entera) return x.entera > y.entera ? 1 : -1;
    const largo = Math.max(x.fraccion.length, y.fraccion.length);
    const fx = x.fraccion.padEnd(largo, '0');
    const fy = y.fraccion.padEnd(largo, '0');
    if (fx === fy) return 0;
    return fx > fy ? 1 : -1;
  }

  /**
   * Devuelve 1 si a > b, -1 si a < b y 0 si son iguales.
   * En notación decimal la comparación se hace sobre los dígitos, de modo que
   * no se pierde precisión por el redondeo de IEEE-754 (9007199254740993 y
   * 9007199254740992 son el mismo Number). Con exponente se usa Number.
   */
  function compararNumeros(a, b) {
    if (/e/i.test(a.texto) || /e/i.test(b.texto)) {
      return a.valor === b.valor ? 0 : a.valor > b.valor ? 1 : -1;
    }
    const x = partesDecimal(a.texto);
    const y = partesDecimal(b.texto);
    if (x.negativo !== y.negativo) return x.negativo ? -1 : 1;
    const magnitud = compararMagnitud(x, y);
    return x.negativo ? -magnitud : magnitud;
  }

  function mayorDeDos(entrada1, entrada2) {
    const a = interpretarNumero(entrada1);
    const b = interpretarNumero(entrada2);
    const errores = {};
    if (!a.ok) errores.primero = a.error;
    if (!b.ok) errores.segundo = b.error;
    if (!a.ok || !b.ok) return { valido: false, errores };

    const orden = compararNumeros(a, b);
    return {
      valido: true,
      orden,
      mayor: orden === 0 ? null : orden > 0 ? 'primero' : 'segundo',
      a: a.texto,
      b: b.texto,
    };
  }

  /* ------------------------------------------------------------------ */
  /* Ejercicios 3 y 4. Vocales                                           */
  /* ------------------------------------------------------------------ */

  /**
   * Ejercicio 3: vocales distintas que aparecen, en orden de primera
   * aparición. «á», «Á» y «a» cuentan como la misma vocal; se conservan las
   * formas con tilde o diéresis encontradas para mostrarlas al usuario.
   */
  function vocalesPresentes(frase) {
    const formas = new Map(); // vocal base → Set de formas encontradas
    for (const caracter of String(frase ?? '')) {
      const base = vocalBase(caracter);
      if (!base) continue;
      if (!formas.has(base)) formas.set(base, new Set());
      formas.get(base).add(caracter.toLocaleLowerCase('es'));
    }
    return Array.from(formas, ([vocal, conjunto]) => ({
      vocal,
      formas: Array.from(conjunto).filter((f) => f !== vocal),
    }));
  }

  /**
   * Ejercicio 4: número de apariciones de cada vocal. Una sola pasada sobre
   * la frase, O(n). Las cinco vocales aparecen siempre en el resultado,
   * también con 0, para que la ausencia sea visible.
   */
  function contarVocales(frase) {
    const conteo = { a: 0, e: 0, i: 0, o: 0, u: 0 };
    let total = 0;
    let letras = 0;
    for (const caracter of String(frase ?? '')) {
      if (/\p{L}/u.test(caracter)) letras++;
      const base = vocalBase(caracter);
      if (base) {
        conteo[base]++;
        total++;
      }
    }
    return { conteo, total, letras };
  }

  const API = {
    VOCALES,
    plegar,
    analizarPalindromo,
    interpretarNumero,
    compararNumeros,
    mayorDeDos,
    vocalesPresentes,
    contarVocales,
  };

  if (typeof module === 'object' && module.exports) {
    module.exports = API;
  } else {
    global.Ejercicios = Object.freeze(API);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
