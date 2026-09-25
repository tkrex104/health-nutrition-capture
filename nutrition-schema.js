'use strict';

// 保存用は date を含む18列。画像から読むのは date 以外の17栄養値です。
const nutritionFields = [
  'kcal', 'protein_g', 'fat_g', 'carbohydrates_g', 'calcium_mg',
  'magnesium_mg', 'iron_mg', 'zinc_mg', 'vitamin_a_ug', 'vitamin_d_ug',
  'vitamin_b1_mg', 'vitamin_b2_mg', 'vitamin_b6_mg', 'vitamin_c_mg',
  'dietary_fiber_g', 'saturated_fat_g', 'salt_g'
];

const storageHeaders = ['date'].concat(nutritionFields);

function validateNutrition(values, requireAll) {
  const required = requireAll ? nutritionFields : ['kcal', 'protein_g', 'fat_g', 'carbohydrates_g'];
  const missing = required.filter(key => values[key] === undefined || values[key] === null || values[key] === '' || !Number.isFinite(Number(values[key])));
  if (missing.length) throw new Error('Missing or invalid fields: ' + missing.join(', '));
  nutritionFields.forEach(key => {
    if (values[key] === undefined || values[key] === null || values[key] === '') return;
    if (!Number.isFinite(Number(values[key])) || Number(values[key]) < 0) {
      throw new Error('Invalid non-negative number: ' + key);
    }
  });
  return Object.fromEntries(nutritionFields.map(key => [key,
    values[key] === undefined || values[key] === null || values[key] === '' ? null : Number(values[key])
  ]));
}

module.exports = {nutritionFields, storageHeaders, validateNutrition};
