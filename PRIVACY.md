# Privacy Boundary

## Publicにしてよいもの

- iPhone共有シートから画像を受け取るShortcut構造
- 横1200pxへのResize、Base64化、`today`／`yesterday`選択
- 一般化したJSON requestとJSON response
- 日付を含む18列の保存schemaと、17栄養値の抽出schema
- 抽出・検証・保存adapterの一般実装
- Synthetic input、Setup手順、Prompt

## Privateにするもの

- 実Web App URL、Spreadsheet ID、認証トークン、API key
- 実運用endpointとScript Properties
- 個人の栄養・健康データ
- 実あすけん画面、端末スクリーンショット

公開資料ではURLを`YOUR_WEB_APP_URL`または完全にマスクした表記にします。実スクリーンショットをサンプル画像として追加しません。
