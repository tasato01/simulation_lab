# Simulation Lab (シミュレーション・ラボ)

「思いついたシミュレーションのアイデアを、面倒な設定なしに即座に形にする」ためのモノレポ環境です。
描画には `p5.js` を、値の調整UIには `Tweakpane` を採用しています。

## 使い方

### 1. 開発サーバーの立ち上げ
```bash
npm run dev
```
起動後、ブラウザで [http://localhost:5173](http://localhost:5173) にアクセスすると、スケッチのメニューリストが表示されます。

### 2. 新しいスケッチの作成（新ネタを思いついたらコレ！）
ターミナルで以下の作成コマンドを実行します。
```bash
npm run new [スケッチ名]
# 例: npm run new 002-collision
```
このコマンドを実行すると自動的に以下のことが行われます：
1. `templates/basic-p5` の内容が新しいフォルダとしてコピーされます。
2. ルートの `index.html` に新しいスケッチへのリンクが追加されます。

以降は作成された `sketches/002-collision/sketch.js` をエディタで編集するだけです。保存するとブラウザが自動更新（ホットリロード）され、即座にシミュレーション結果を確認できます。

---

## 共通ルールの利用と追加 (`shared/` ディレクトリ)

`shared/physics.js` などの共有ディレクトリは、**「すべての作品で使い回す計算ロジックや定数」**を置いておく場所です。

### ▶ ルール（物理量や関数）を新しく追加する
`shared/physics.js` を開き、新しい定数や関数に `export` をつけて定義します。

```javascript
// 例：摩擦係数を追加する
export const FRICTION = 0.98;

// 例：2点間の距離を計算する関数を追加する
export function getDistance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1)**2 + (y2 - y1)**2);
}
```

### ▶ スケッチ側でルールを利用する
各スケッチの `sketch.js` の一番上で、使いたい変数を import して使用します。
```javascript
import { FRICTION, getDistance } from '../../shared/physics.js';

// 毎フレームの速度減衰などで使う
velocity *= FRICTION; 
```

---

## Tweakpane（UIパネル）の使い方

直感的に物理シミュレーションを調整するため、Tweakpaneを組み込んでいます。画面右上のUIパネルです。

1. **初期値を用意する**
   `sketch.js` の上部にある `PARAMS` オブジェクトに、調整したい値を書いておきます。
   ```javascript
   const PARAMS = { speed: 10, color: '#ff0000' };
   ```
2. **パネルと紐付ける**
   `p.setup` 関数の中でバインドします。 `min`, `max` を設定するとスライダーになります。
   ```javascript
   pane.addBinding(PARAMS, 'speed', { min: 0, max: 50 });
   ```
3. **描画に使う**
   `p.draw` などのループ内で `PARAMS.speed` のように値を参照して使います。

> 💡 *各種ファイルのコード内に詳しいコメント(解説)を記載しているので、コード上のコメントもぜひ読んでみてください。*
