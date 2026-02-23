import p5 from 'p5';
import { Pane } from 'tweakpane';
import { GRAVITY } from '../../shared/physics.js';
// カメラクラスと共通ユーティリティを読み込む
import { Camera, drawGrid } from '../../shared/view.js';

/**
 * ==========================================
 * パラメータ設定 (Tweakpane用)
 * ==========================================
 */
const PARAMS = {
    theme: 'light', // 'light' or 'dark'
    radius: 10,
    gravity: GRAVITY,
    color: '#ff0055'
};

const sketch = (p) => {
    let pane;
    let camera; // カメラインスタンス

    p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);

        // 初期表示範囲を100としてカメラを生成
        camera = new Camera(p, 100);

        pane = new Pane({ title: 'パラメータ調整' });

        // テーマ切り替え
        pane.addBinding(PARAMS, 'theme', {
            options: { Light: 'light', Dark: 'dark' },
            label: 'テーマ'
        }).on('change', (ev) => {
            // テーマ変更時にHTMLの背景色も合わせる
            if (ev.value === 'dark') {
                document.body.style.backgroundColor = '#1a1a1a';
                document.body.style.color = 'white';
            } else {
                document.body.style.backgroundColor = '#f7f9fc';
                document.body.style.color = '#333';
            }
        });

        pane.addBinding(PARAMS, 'radius', { min: 1, max: 50, label: '半径' });
        pane.addBinding(PARAMS, 'gravity', { min: 0, max: 20, label: '重力' });
        pane.addBinding(PARAMS, 'color', { label: '色' });

        // カメラのリセットボタン
        pane.addButton({ title: '視点リセット (Reset View)' }).on('click', () => {
            camera.x = 0;
            camera.y = 0;
            camera.zoom = 1.0;
        });
    };

    p.draw = () => {
        // テーマに応じた背景色
        if (PARAMS.theme === 'dark') {
            p.background(30, 30, 30);
        } else {
            p.background(247, 249, 252);
        }

        // --- カメラ（パン・ズーム・WASD）の更新と適用 ---
        camera.update(); // WASDキー操作を反映
        camera.apply();  // 座標系とスケールを適用

        // XY軸とグリッドを描画（10区切り）テーマを渡す
        drawGrid(p, camera, 10, PARAMS.theme);

        // オブジェクトの描画
        p.fill(PARAMS.color);
        p.noStroke();

        // 画面の中央(0, 0)に円を描画
        p.circle(0, 0, PARAMS.radius * 2);
    };

    p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
    };
};

new p5(sketch);
