import p5 from 'p5';
import { Pane } from 'tweakpane';
import { GRAVITY } from '../../shared/physics.js';

/**
 * ==========================================
 * パラメータ設定 (Tweakpane用)
 * ==========================================
 * ここで定義した変数がUIパネルに表示され、
 * リアルタイムで値を調整できるようになります。
 */
const PARAMS = {
    radius: 50,
    gravity: GRAVITY, // shared/physics.js から読み込んだ共通の定数を使用
    color: '#ff0055'  // カラーコードを書くとTweakpaneが自動でカラーピッカーにしてくれます
};

const sketch = (p) => {
    let pane;

    // setupは最初に1回だけ呼ばれる関数です
    p.setup = () => {
        // ブラウザの画面いっぱいに描画領域（キャンバス）を作成
        p.createCanvas(p.windowWidth, p.windowHeight);

        // Tweakpane (画面右上のUIパネル) の初期化
        pane = new Pane({ title: 'パラメータ調整' });

        // UIパネルに変数を紐付け（バインド）する
        // min, max を指定すると自動的にスライダーになります
        pane.addBinding(PARAMS, 'radius', { min: 10, max: 200, label: '半径' });
        pane.addBinding(PARAMS, 'gravity', { min: 0, max: 20, label: '重力' });
        pane.addBinding(PARAMS, 'color', { label: '色' });
    };

    // drawは毎フレーム（通常秒間60回）呼ばれる関数です
    p.draw = () => {
        // 背景を暗いグレーで塗りつぶす（過去のフレームの残像を消す）
        p.background(30);

        // PARAMSの現在の色を塗りつぶし色に指定
        p.fill(PARAMS.color);
        p.noStroke(); // 枠線を消す

        // 画面の中央に円を描画
        // UIパネルで radius をスライダーで変更すると、ここの計算に即座に反映されます
        p.circle(p.width / 2, p.height / 2, PARAMS.radius * 2);
    };

    // ブラウザのウィンドウサイズが変更されたらキャンバスも自動でリサイズする処理
    p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
    };
};

// p5.jsのインスタンスモードでスケッチを起動
new p5(sketch);
