# Nutrition Screenshot Capture

このRepositoryをChappyへ渡して、`PROMPT.md`を使って自分の環境へ合わせてください。

iPhoneの共有シートから栄養画面のスクリーンショットを送り、画像から読んだ栄養データを自分の保存先へ記録する最小キットです。実URL、実スクリーンショット、個人データは含みません。

## できること

1. 栄養画面をスクリーンショットします。
2. 共有シートからShortcutを実行します。
3. Shortcutは画像を横1200pxへ縮小し、Base64化します。
4. `今日分`または`昨日分`を選んでBackendへ送ります。
5. Backendは栄養値を抽出・検証し、同日データを更新保存します。

## 最初の設定

コードを読む必要はありません。まず`PROMPT.md`をChappyへ渡してください。設定は次の順番です。

1. **保存先を決める**：Google Sheetsなど、本人が管理する保存先を決めます。
2. **Backendを設定する**：`src/google-apps-script/Code.gs`を自分のApps Scriptプロジェクトへ追加します。
3. **Endpointを取得する**：Web Appとしてデプロイし、URLを端末だけに保存します。
4. **ShortcutへEndpointを設定する**：`shortcut/BUILD_WITH_CHAPPY.md`に沿って作ります。
5. **Synthetic Sampleでテストする**：`sample/synthetic-nutrition.json`で数値入力経路を確認します。
6. **自分のスクリーンショットでテストする**：最初はResponseを確認してから保存内容を見ます。

## 設定値の置き場所

`config.example.json`は説明用です。実値を入れてコミットしないでください。Apps Scriptでは次の値を**スクリプトプロパティ**へ設定します。

- `NUTRITION_API_TOKEN`
- `OPENAI_API_KEY`
- `STORAGE_SPREADSHEET_ID`

保存用シート名はサンプルでは`Nutrition_Daily`です。1行目に`date`と17栄養値の列を、この順で用意します。

```text
date, kcal, protein_g, fat_g, carbohydrates_g, calcium_mg, magnesium_mg,
iron_mg, zinc_mg, vitamin_a_ug, vitamin_d_ug, vitamin_b1_mg,
vitamin_b2_mg, vitamin_b6_mg, vitamin_c_mg, dietary_fiber_g,
saturated_fat_g, salt_g
```

## 実際のリクエストとレスポンス

ShortcutはJSONでPOSTします。画像経路の一般形です。

```json
{
  "token": "端末内だけで保持する値",
  "date_mode": "today",
  "image_base64": "BASE64_ENCODED_IMAGE",
  "image_mime_type": "image/jpeg"
}
```

`date_mode`は`today`または`yesterday`です。明示的な`date`があれば`yyyy-MM-dd`を優先します。

成功時は、例えば次のJSONを返します。

```json
{"ok":true,"date":"YYYY-MM-DD","source":"screenshot","storage_row":2}
```

失敗時は、例えば次のJSONを返します。

```json
{"ok":false,"error":"Missing nutrition fields: vitamin_c_mg"}
```

## 実装確認済みのフロー

| Step | Confirmed | Implementation | Public / Private |
|---|---|---|---|
| Asken | 栄養画面を使う | 読み取り対象は画面の摂取量 | Privateな実画面 |
| Screenshot | iPhoneで撮影 | Shortcutの共有シート入力 | Shortcut構造はPublic可 |
| iOS Share Sheet | Imageを受信 | `あすけん詳細栄養素登録` | Shortcut名は説明用途でPublic可 |
| Shortcut | 横1200pxへResize | 高さは自動 | Public可 |
| Base64 | 縮小画像をエンコード | JSONの`image_base64` | Public可、実画像はPrivate |
| Today / Yesterday | 利用者が選ぶ | `date_mode: today/yesterday` | Public可 |
| GAS | Web AppへPOST | `doPost(e)`でJSONを受信 | URL・tokenはPrivate |
| Image extraction | 構造化出力で画像を読む | 17栄養値をJSON schemaで要求 | Prompt・ロジックはPublic可、keyはPrivate |
| Validation | 画像経路では全値必須 | 数値・非負値を検証 | Public可 |
| Storage | 同日値を更新する | 日付行をupsert | adapterはPublic可、保存先ID・実データはPrivate |

保存スキーマは`date`を含む18列です。画像抽出の対象は`date`以外の17栄養値です。

## テスト

Node.jsが使える環境で、次だけを実行します。

```bash
node --test tests/nutrition-schema.test.cjs
```

このテストはSynthetic inputだけを使います。実画像、実endpoint、実アカウントへは接続しません。

詳しい公開境界は`PRIVACY.md`、実装上の制限は`KNOWN_LIMITATIONS.md`を参照してください。
