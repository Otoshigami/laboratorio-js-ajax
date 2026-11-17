// Pruebas unitarias de la lógica pura. Ejecutar con:  node --test
const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../js/ejercicios.js');

test('1. Palíndromos con tildes, espacios y puntuación', () => {
  for (const frase of [
    'Reconocer',
    'Anita lava la tina',
    'Dábale arroz a la zorra el abad',
    '¿Acaso hubo búhos acá?',
    'A man, a plan, a canal: Panama!',
    '12321',
  ]) {
    assert.equal(E.analizarPalindromo(frase).esPalindromo, true, frase);
  }
});

test('1. Señala la primera diferencia y no confunde ñ con n', () => {
  const r = E.analizarPalindromo('Javascript');
  assert.equal(r.esPalindromo, false);
  assert.deepEqual(r.diferencia, { izquierda: 0, derecha: 9 });
  assert.equal(E.analizarPalindromo('ñan').esPalindromo, false); // plegar ñ→n diría que sí
  assert.equal(E.analizarPalindromo('a').esPalindromo, true);
});

test('1. Rechaza entradas sin letras ni números', () => {
  assert.equal(E.analizarPalindromo('  ¡¿?! ').valido, false);
  assert.equal(E.analizarPalindromo('').valido, false);
});

test('2. Compara como números, no como texto', () => {
  assert.equal(E.mayorDeDos('10', '9').mayor, 'primero'); // como texto, '10' < '9'
  assert.equal(E.mayorDeDos('-3', '-20').mayor, 'primero');
  assert.equal(E.mayorDeDos('3,5', '3.49').mayor, 'primero');
  assert.equal(E.mayorDeDos('1e3', '999').mayor, 'primero');
  assert.equal(E.mayorDeDos('.5', '0,50').mayor, null);
  assert.equal(E.mayorDeDos('-0', '0').mayor, null);
});

test('2. Exacto más allá de Number.MAX_SAFE_INTEGER', () => {
  assert.equal(9007199254740993 === 9007199254740992, true); // el problema de IEEE-754
  assert.equal(E.mayorDeDos('9007199254740993', '9007199254740992').mayor, 'primero');
  assert.equal(E.mayorDeDos('0.30000000000000001', '0.3').mayor, 'primero');
});

test('2. Rechaza lo que Number() y parseFloat() aceptan en silencio', () => {
  assert.equal(E.mayorDeDos('', '5').valido, false); // Number('') === 0
  assert.equal(E.mayorDeDos('12abc', '5').valido, false); // parseFloat('12abc') === 12
  assert.equal(E.mayorDeDos('1.234,5', '5').valido, false);
  assert.equal(E.mayorDeDos('1e400', '5').valido, false); // Infinity
});

test('3. Vocales distintas en orden de aparición', () => {
  assert.deepEqual(E.vocalesPresentes('Murciélago').map((v) => v.vocal), ['u', 'i', 'e', 'a', 'o']);
  assert.deepEqual(E.vocalesPresentes('Pingüino').map((v) => v.vocal), ['i', 'u', 'o']);
  assert.deepEqual(E.vocalesPresentes('Pingüino')[1].formas, ['ü']);
  assert.deepEqual(E.vocalesPresentes('Rhythm & blues 🎸').map((v) => v.vocal), ['u', 'e']);
  assert.deepEqual(E.vocalesPresentes('PSST'), []);
});

test('4. Conteo por vocal, con tildes y mayúsculas', () => {
  const r = E.contarVocales('Hola, ¿cómo estás?');
  assert.deepEqual(r.conteo, { a: 2, e: 1, i: 0, o: 3, u: 0 });
  assert.equal(r.total, 6);
  assert.equal(r.letras, 13);
  assert.equal(E.contarVocales('AÁÀÄ').conteo.a, 4);
  assert.equal(E.contarVocales('').total, 0);
});
