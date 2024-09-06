# 機能

- 新規issue作成時にスプレッドシートにも同様の内容を追加する。
- issueのラベル更新時に対応したスプレッドシート上の進捗状況も更新する。
- スプレッドシート上の進捗状況が[完了]になれば別途専用のシートに対象行を移動する。

# はじめに

## Google Apps Script APIの有効化

https://script.google.com/home/usersettings から Google Apps Script APIをオンに変更してください。

## 設定ファイル

```bash
$ cp .clasp.json.template .clasp.json
```

`.clasp.json`内の`scriptId`を、対象のスプレッドシートのスクリプトIDに変更してください。
https://blog-and-destroy.com/42782

## 依存関係のインストール

```bash
$ npm i
```

## Claspのログイン

```bash
$ npx clasp login
```

# デプロイ

```bash
$ npm run deploy
```

ブラウザのGASエディタ右上のデプロイボタンから、`新しいデプロイ`を選択し`ウェブアプリ`としてデプロイしてください。
そして、生成されたウェブアプリのURLをGitHubのWebhookに設定し直したら反映完了です。
