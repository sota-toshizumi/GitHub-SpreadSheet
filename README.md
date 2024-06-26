# Githubのissueをスプレッドシートに反映

### 概要
githubのwebhookを用いて、githubのissueが更新されたらスプレッドシートにリクエストを送信しスプレッドシート上に情報の追加,更新を行う。
### 実装機能
- 新規issue作成時にスプレッドシートにも同様の内容を追加する。 
- issueのラベル更新時に対応したスプレッドシート上の進捗状況も更新する。
- スプレッドシート上の進捗状況が[完了]になれば別途専用のシートに対象行を移動する。
### 実装内容
#### github側
githubのwebhookの登録を行う。

- settings-webhookにて設定を行う。
- スプレッドシート(GAS)デプロイ時に発行されるurlの登録。
#### spreadsheet側
スプレッドシート拡張機能Google Apps Script(GAS)でシート操作,httpリクエスト処理を行う。
