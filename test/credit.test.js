import assert from 'node:assert/strict';
import test from 'node:test';
import { selectDebt, selectScore } from '../src/services/credit.service.js';
import { hashApiToken } from '../src/services/apiToken.service.js';
import { classifyDebt, classifyScore } from '../src/utils/credit.js';

test('clasifica los limites del score correctamente', () => {
  assert.equal(classifyScore(850), 'Excelente');
  assert.equal(classifyScore(750), 'Excelente');
  assert.equal(classifyScore(749), 'Bueno');
  assert.equal(classifyScore(650), 'Bueno');
  assert.equal(classifyScore(649), 'Regular');
  assert.equal(classifyScore(550), 'Regular');
  assert.equal(classifyScore(549), 'Riesgoso');
});

test('clasifica el porcentaje de endeudamiento', () => {
  assert.equal(classifyDebt(34.99), 'Bajo');
  assert.equal(classifyDebt(35), 'Medio');
  assert.equal(classifyDebt(60), 'Medio');
  assert.equal(classifyDebt(60.01), 'Alto');
});

test('el API token se almacena como un hash SHA-256', () => {
  const hash = hashApiToken('snic_token_de_prueba');

  assert.equal(hash.length, 64);
  assert.equal(hash, hashApiToken('snic_token_de_prueba'));
  assert.notEqual(hash, 'snic_token_de_prueba');
});

test('proyecta respuestas equivalentes para REST y SOAP', () => {
  const history = {
    identificacion: '001-1234567-8',
    poseeHistorial: true,
    scoreCrediticio: 780,
    prestamosActivos: 2,
    tarjetasCredito: 1,
    porcentajeEndeudamiento: 38.5,
    nivelEndeudamiento: 'Medio',
    poseeMoraActual: false,
    estadoGeneral: 'Excelente',
  };

  assert.deepEqual(selectScore(history), {
    identificacion: '001-1234567-8',
    poseeHistorial: true,
    scoreCrediticio: 780,
    estadoGeneral: 'Excelente',
  });
  assert.deepEqual(selectDebt(history), {
    identificacion: '001-1234567-8',
    prestamosActivos: 2,
    tarjetasCredito: 1,
    porcentajeEndeudamiento: 38.5,
    nivelEndeudamiento: 'Medio',
    poseeMoraActual: false,
  });
});
