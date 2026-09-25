/**
 * Generic Nutrition Screenshot Capture for Google Apps Script.
 * Set these Script Properties: NUTRITION_API_TOKEN, OPENAI_API_KEY,
 * STORAGE_SPREADSHEET_ID. Do not put their values in this file.
 */
const NC_TIMEZONE = 'Asia/Tokyo';
const NC_SHEET = 'Nutrition_Daily';
const NC_FIELDS = ['kcal','protein_g','fat_g','carbohydrates_g','calcium_mg','magnesium_mg','iron_mg','zinc_mg','vitamin_a_ug','vitamin_d_ug','vitamin_b1_mg','vitamin_b2_mg','vitamin_b6_mg','vitamin_c_mg','dietary_fiber_g','saturated_fat_g','salt_g'];
const NC_HEADERS = ['date'].concat(NC_FIELDS);

function doPost(e) {
  try {
    const request = JSON.parse(e.postData.contents);
    ncVerifyToken_(request.token);
    const date = ncResolveDate_(request.date, request.date_mode);
    const source = request.image_base64 ? 'screenshot' : 'numeric_json';
    const values = request.image_base64
      ? ncExtractImage_(request.image_base64, request.image_mime_type || 'image/jpeg')
      : request;
    const nutrition = ncValidate_(values, source === 'screenshot');
    const row = ncUpsert_(date, nutrition);
    return ncJson_({ok: true, date: date, source: source, storage_row: row});
  } catch (error) {
    console.error(error);
    return ncJson_({ok: false, error: error.message || String(error)});
  }
}

function ncVerifyToken_(received) {
  const expected = PropertiesService.getScriptProperties().getProperty('NUTRITION_API_TOKEN');
  if (!expected || !received || received !== expected) throw new Error('Authentication failed.');
}

function ncResolveDate_(date, mode) {
  if (date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date))) throw new Error('date must be yyyy-MM-dd.');
    return String(date);
  }
  const normalized = String(mode || 'today').toLowerCase();
  if (normalized !== 'today' && normalized !== 'yesterday') throw new Error('date_mode must be today or yesterday.');
  const value = new Date();
  if (normalized === 'yesterday') value.setDate(value.getDate() - 1);
  return Utilities.formatDate(value, NC_TIMEZONE, 'yyyy-MM-dd');
}

function ncExtractImage_(base64, mimeType) {
  const clean = String(base64).replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '').replace(/\s/g, '');
  if (!clean) throw new Error('Image data is empty.');
  if (clean.length > 12 * 1024 * 1024) throw new Error('Image is too large. Resize to about 1200px wide.');
  const key = PropertiesService.getScriptProperties().getProperty('OPENAI_API_KEY');
  if (!key) throw new Error('OPENAI_API_KEY is not configured.');
  const properties = {};
  NC_FIELDS.forEach(function(field) { properties[field] = {type: 'number'}; });
  const payload = {
    model: 'gpt-5.4-mini', store: false, reasoning: {effort: 'low'},
    input: [{role: 'system', content: [{type: 'input_text', text: 'Read only the intake values shown in a nutrition screenshot. Do not use targets, labels such as high/low, or advertising.'}]},
      {role: 'user', content: [{type: 'input_text', text: 'Return the requested nutrition values as JSON without unit conversion.'}, {type: 'input_image', image_url: 'data:' + (mimeType === 'image/png' ? 'image/png' : 'image/jpeg') + ';base64,' + clean, detail: 'high'}]}],
    text: {format: {type: 'json_schema', name: 'nutrition_capture', strict: true, schema: {type: 'object', properties: properties, required: NC_FIELDS, additionalProperties: false}}}
  };
  const response = UrlFetchApp.fetch('https://api.openai.com/v1/responses', {method: 'post', contentType: 'application/json', headers: {Authorization: 'Bearer ' + key}, payload: JSON.stringify(payload), muteHttpExceptions: true});
  if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) throw new Error('Image extraction request failed.');
  const body = JSON.parse(response.getContentText());
  if (!body.output_text) throw new Error('Image extraction returned no data.');
  return JSON.parse(body.output_text);
}

function ncValidate_(values, requireAll) {
  const required = requireAll ? NC_FIELDS : ['kcal','protein_g','fat_g','carbohydrates_g'];
  const missing = required.filter(function(field) { return values[field] === undefined || values[field] === null || values[field] === '' || !isFinite(Number(values[field])); });
  if (missing.length) throw new Error('Missing nutrition fields: ' + missing.join(', '));
  const result = {};
  NC_FIELDS.forEach(function(field) {
    const value = values[field];
    if (value === undefined || value === null || value === '') { result[field] = ''; return; }
    if (!isFinite(Number(value)) || Number(value) < 0) throw new Error('Invalid nutrition value: ' + field);
    result[field] = Number(value);
  });
  return result;
}

function ncUpsert_(date, values) {
  const id = PropertiesService.getScriptProperties().getProperty('STORAGE_SPREADSHEET_ID');
  if (!id) throw new Error('STORAGE_SPREADSHEET_ID is not configured.');
  const sheet = SpreadsheetApp.openById(id).getSheetByName(NC_SHEET);
  if (!sheet) throw new Error('Storage sheet not found.');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  NC_HEADERS.forEach(function(header) { if (headers.indexOf(header) === -1) throw new Error('Missing storage header: ' + header); });
  const rows = Math.max(sheet.getLastRow() - 1, 0) ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues() : [];
  let row = rows.findIndex(function(item) { return Utilities.formatDate(new Date(item[0]), NC_TIMEZONE, 'yyyy-MM-dd') === date; }) + 2;
  if (row < 2) row = sheet.getLastRow() + 1;
  sheet.getRange(row, 1, 1, NC_HEADERS.length).setValues([[new Date(date + 'T12:00:00')].concat(NC_FIELDS.map(function(field) { return values[field]; }))]);
  return row;
}

function ncJson_(body) { return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON); }
