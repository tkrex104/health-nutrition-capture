# iPhone ShortcutをChappyと作る手順

配布用Shortcutは含めません。自分のEndpointと認証情報を端末内で設定するため、以下をChappyと一Stepずつ作成してください。

1. 新規Shortcutを作り、共有シートで受信できるようにします。受信対象は`画像`です。
2. `ショートカットの入力`を横幅`1200`pxへリサイズします。高さは自動にします。
3. リサイズ結果をBase64エンコードします。
4. リストから`今日分`と`昨日分`を選びます。選択結果は`date_mode`に入れます。
5. 辞書を作ります。`token`、`date_mode`、`image_base64`、`image_mime_type`を設定します。`token`は端末内の値を使い、公開しません。
6. `URLの内容を取得`で、設定済みのWeb App URLへJSONのPOSTを送ります。
7. 返ったJSONを表示します。`ok: true`なら保存成功、`ok: false`なら`error`を確認します。

URLには`YOUR_WEB_APP_URL`を使い、実URLを共有・スクリーンショット・公開物へ含めないでください。
