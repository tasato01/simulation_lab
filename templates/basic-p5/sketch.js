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

        // 設定ボタン（フォルダ）の追加
        const settingsFolder = pane.addFolder({ title: '設定' });

        // テーマ切り替えを設定フォルダ内に配置
        settingsFolder.addBinding(PARAMS, 'theme', {
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
    };

    p.draw = () => {
        // テーマに応じた背景色
        if (PARAMS.theme === 'dark') {
            p.background(30, 30, 30);
        } else {
            p.background(247, 249, 252);
        }

        // --- カメラ（パン・ズーム）のスケールと移動を適用 ---
        camera.apply();

        // DESMOS風の動的グリッドを描画
        drawGrid(p, camera, PARAMS.theme);

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
