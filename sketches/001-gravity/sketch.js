import p5 from 'p5';
import { Pane } from 'tweakpane';
// 共通の物理ルール（重力や反発係数など）を読み込む
import { GRAVITY, DEFAULT_RESTITUTION } from '../../shared/physics.js';
import { applyView, drawGrid } from '../../shared/view.js';

const PARAMS = {
    viewRange: 100, // 画面が表示する範囲
    radius: 10,     // ボールの相対的な半径
    gravity: GRAVITY,
    // 跳ね返りやすさ。1.0で全くエネルギーを失わず、0でピタッと止まります
    restitution: DEFAULT_RESTITUTION,
    color: '#00ccff'
};

const sketch = (p) => {
    let pane;

    // ボールの状態を表す変数
    // 画面中央を(0,0)、Y軸上向きとした座標系に合わせて初期位置を設定
    let y = 80;  // 画面の上の方（初期位置）
    let vy = 0;  // Y方向の速度

    p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);

        pane = new Pane({ title: 'Physics Settings' });
        pane.addBinding(PARAMS, 'viewRange', { min: 20, max: 200 });
        pane.addBinding(PARAMS, 'radius', { min: 2, max: 50 });
        pane.addBinding(PARAMS, 'gravity', { min: 0, max: 30 });
        pane.addBinding(PARAMS, 'restitution', { min: 0, max: 1 });
        pane.addBinding(PARAMS, 'color');

        // UIパネルにボタンを追加して、クリックされたら変数を初期化する処理
        const btn = pane.addButton({ title: 'リセット (Reset)' });
        btn.on('click', () => {
            y = PARAMS.viewRange * 0.8; // ビューの一番上の少し下に戻す
            vy = 0; // 速度もゼロに戻す
        });
    };

    p.draw = () => {
        // 全体的に明るいデザイン
        p.background(247, 249, 252);

        // --- 座標系の適用 ---
        // YY座標系（Y軸上向き）を適用する
        applyView(p, PARAMS.viewRange);

        // グリッドを描画
        drawGrid(p, PARAMS.viewRange, 10);

        p.fill(PARAMS.color);
        p.noStroke();

        // --- 物理演算のステップ ---
        const delta = p.deltaTime / 100;

        // 速度(vy) に 重力加速度 × 時間 を加算 
        // ※ Y軸上向きの座標系になったため、重力（下向き）はマイナス(-)します
        vy -= PARAMS.gravity * delta;

        // 座標(y) に 速度 × 時間 を加算 
        y += vy * delta;

        // --- 衝突判定 ---
        // 床の高さは描画範囲の一番下 (-viewRange) になります
        if (y - PARAMS.radius < -PARAMS.viewRange) {
            // 画面外にめり込まないように補正
            y = -PARAMS.viewRange + PARAMS.radius;
            // 速度を反転させ、跳ね返り係数(restitution)をかけて減速させる
            vy *= -PARAMS.restitution;
        }

        // 計算された最新のY座標を使って、X座標は0(中央)に円を描画する
        p.circle(0, y, PARAMS.radius * 2);
    };

    p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
    };
};

new p5(sketch);
