/**
 * ==========================================
 * 画面描画と座標系に関する共通ユーティリティ
 * ==========================================
 */

/**
 * 画面中央を原点とし、指定した範囲が画面に収まるように座標系を変換します。
 * Y軸は上方向がプラスになる、数学でお馴染みのXY座標系になります。
 * 
 * @param {import('p5')} p - p5.jsのインスタンス
 * @param {number} viewRange - 画面中央から一番近い端までの距離（表示範囲）
 */
export function applyView(p, viewRange) {
    // 画面の短い方の辺の半分を基準にスケール比率を決定
    const minDim = Math.min(p.width, p.height);
    const scaleFactor = (minDim / 2) / viewRange;

    // 原点を画面中央に移動
    p.translate(p.width / 2, p.height / 2);

    // Y軸を反転（上方向を+）してスケールを適用
    p.scale(scaleFactor, -scaleFactor);
}

/**
 * 現在のビュー範囲に合わせてグリッドとXY軸を描画します。
 * 
 * @param {import('p5')} p - p5.jsのインスタンス
 * @param {number} viewRange - 現在のビュー範囲
 * @param {number} step - グリッドの1マスのサイズ（デフォルトは10）
 */
export function drawGrid(p, viewRange, step = 10) {
    p.push();

    // 画面全体をカバーできるように、縦横比を考慮して最大描画範囲を計算
    const maxRange = viewRange * Math.max(p.width, p.height) / Math.min(p.width, p.height);

    // スケールをかけたことによって線が太くならないよう、逆数で線幅を補正する係数
    const weightScale = 1 / ((Math.min(p.width, p.height) / 2) / viewRange);

    // 縦線を描画
    for (let x = -Math.ceil(maxRange / step) * step; x <= maxRange; x += step) {
        if (Math.abs(x) < 0.001) {
            p.stroke(150, 150, 150, 150); // Y軸はやや濃いグレー
            p.strokeWeight(2 * weightScale);
        } else {
            p.stroke(220, 220, 220, 150); // 通常のグリッド線は薄いグレー
            p.strokeWeight(1 * weightScale);
        }
        p.line(x, -maxRange, x, maxRange);
    }

    // 横線を描画
    for (let y = -Math.ceil(maxRange / step) * step; y <= maxRange; y += step) {
        if (Math.abs(y) < 0.001) {
            p.stroke(150, 150, 150, 150); // X軸はやや濃いグレー
            p.strokeWeight(2 * weightScale);
        } else {
            p.stroke(220, 220, 220, 150);
            p.strokeWeight(1 * weightScale);
        }
        p.line(-maxRange, y, maxRange, y);
    }

    p.pop();
}
