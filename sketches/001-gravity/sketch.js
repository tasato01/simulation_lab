import p5 from 'p5';
import { Pane } from 'tweakpane';
// 共通の物理ルール（重力や反発係数など）を読み込む
import { GRAVITY, DEFAULT_RESTITUTION, applyGravity } from '../../shared/physics.js';

const PARAMS = {
    radius: 30,
    gravity: GRAVITY,
    // 跳ね返りやすさ。1.0で全くエネルギーを失わず、0でピタッと止まります
    restitution: DEFAULT_RESTITUTION,
    color: '#00ccff'
};

const sketch = (p) => {
    let pane;

    // ボールの状態を表す変数（これらは時間経過で変化するので PARAMS には入れません）
    let y = 50;  // 高さ (Y座標: 画面の上が0、下がプラス)
    let vy = 0;  // Y方向の速度

    p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);

        pane = new Pane({ title: 'Physics Settings' });
        pane.addBinding(PARAMS, 'radius', { min: 10, max: 100 });
        pane.addBinding(PARAMS, 'gravity', { min: 0, max: 30 });
        pane.addBinding(PARAMS, 'restitution', { min: 0, max: 1 });
        pane.addBinding(PARAMS, 'color');

        // UIパネルにボタンを追加して、クリックされたら変数を初期化する処理
        const btn = pane.addButton({ title: 'リセット (Reset)' });
        btn.on('click', () => {
            y = 50; // 高さを初期位置に戻す
            vy = 0; // 速度もゼロに戻す
        });
    };

    p.draw = () => {
        p.background(30);
        p.fill(PARAMS.color);
        p.noStroke();

        // --- 物理演算のステップ ---

        // p.deltaTimeは「前回のフレームから何ミリ秒経過したか」を表します。
        // パソコンの性能（フレームレート）のブレを吸収するために使います。
        // 100で割ってシミュレーション上の適度な時間の進み方（スケール）に調整しています。
        const delta = p.deltaTime / 100;

        // 速度(vy) に 重力加速度 × 時間 を加算 (v = v0 + at)
        // ※ shared/physics.js の applyGravity(vy, delta) を使ってもOKです！
        vy += PARAMS.gravity * delta;

        // 座標(y) に 速度 × 時間 を加算 (y = y0 + vt)
        y += vy * delta;

        // --- 衝突判定 ---

        // ボールの下端 (中心y + 半径) が画面の下端 (p.height) を超えそうになったら
        if (y + PARAMS.radius > p.height) {
            // 画面外にめり込まないように、床の高さぴったりに補正する
            y = p.height - PARAMS.radius;
            // 速度を反転させ、跳ね返り係数(restitution)をかけて減速させる
            vy *= -PARAMS.restitution;
        }

        // 計算された最新のY座標を使って、画面の中央(x)に円を描画する
        p.circle(p.width / 2, y, PARAMS.radius * 2);
    };

    p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
    };
};

new p5(sketch);
