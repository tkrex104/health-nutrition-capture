const assert = require('node:assert/strict');
const test = require('node:test');
const fixture = require('../sample/synthetic-nutrition.json');
const {nutritionFields, storageHeaders, validateNutrition} = require('../src/nutrition-schema');

test('保存schemaはdateを含む18列である', () => {
  assert.equal(storageHeaders.length, 18);
  assert.equal(nutritionFields.length, 17);
});

test('synthetic inputは17栄養値を検証できる', () => {
  const values = validateNutrition(fixture, true);
  assert.equal(values.protein_g, 96.4);
});

test('必須値不足と不正値を拒否する', () => {
  assert.throws(() => validateNutrition({...fixture, vitamin_c_mg: null}, true), /vitamin_c_mg/);
  assert.throws(() => validateNutrition({...fixture, salt_g: -1}, true), /salt_g/);
});
