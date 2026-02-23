import p5 from 'p5';
import { Pane } from 'tweakpane';
import { GRAVITY } from '../../shared/physics.js';
// 座標系と画面描画に関する共通ユーティリティを追加
import { applyView, drawGrid } from '../../shared/view.js';

/**
 * ==========================================
 * パラメータ設定 (Tweakpane用)
 * ==========================================
 */
const PARAMS = {
    viewRange: 100, // 画面中央から表示される範囲（スケール）
    radius: 10,     // ビュー範囲に対する相対的な半径
    gravity: GRAVITY,
    color: '#ff0055'
};

const sketch = (p) => {
    let pane;

    p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);

        pane = new Pane({ title: 'パラメータ調整' });

        // 表示範囲の調整スライダーを追加
        pane.addBinding(PARAMS, 'viewRange', { min: 10, max: 200, label: '表示範囲(±)' });
        pane.addBinding(PARAMS, 'radius', { min: 1, max: 50, label: '半径' });
        pane.addBinding(PARAMS, 'gravity', { min: 0, max: 20, label: '重力' });
        pane.addBinding(PARAMS, 'color', { label: '色' });
    };

    p.draw = () => {
        // 全体的に明るいデザイン (ライトグレー)
        p.background(247, 249, 252);

        // --- 【重要】座標系の適用 ---
        // 画面中央を(0, 0)とし、Y軸上向きの数学的座標系に変換する
        applyView(p, PARAMS.viewRange);

        // XY軸とグリッドを描画（10区切り）
        drawGrid(p, PARAMS.viewRange, 10);

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
