/**
 * ==========================================
 * 画面描画と座標系に関する共通ユーティリティ
 * ==========================================
 */

/**
 * 視点操作（パン・ズーム）を管理するカメラクラス
 */
export class Camera {
    /**
     * @param {import('p5')} p - p5.jsのインスタンス
     * @param {number} baseViewRange - 初期状態での表示範囲（スケール）
     */
    constructor(p, baseViewRange) {
        this.p = p;
        this.baseViewRange = baseViewRange;
        this.x = 0; // カメラの中心X座標（ワールド座標）
        this.y = 0; // カメラの中心Y座標（ワールド座標）
        this.zoom = 1.0; // ズーム倍率
        this.isDragging = false;

        // マウスドラッグとホイールのイベントをフックする
        // p5.jsのデフォルトの関数を上書きしないよう、イベントリスナーを使用するのが安全ですが、
        // ここでは使い勝手のため、p5のメソッドに相乗りする形で実装します。
        // （完全な上書きを避けるため、スケッチ側で p.mouseDragged 等が定義されていれば後で呼ばれます）

        const originalMouseDragged = p.mouseDragged;
        p.mouseDragged = (event) => {
            // Tweakpaneの操作中はカメラを動かさない (UIの幅を約300pxと想定し左側をガード)
            if (p.mouseX < 300 && p.mouseY < 500) {
                if (originalMouseDragged) originalMouseDragged(event);
                return;
            }

            // スクリーン座標系の移動量をワールド座標系に変換
            const minDim = Math.min(p.width, p.height);
            const currentViewRange = this.baseViewRange / this.zoom;
            const scaleFactor = (minDim / 2) / currentViewRange;

            this.x -= p.movedX / scaleFactor;
            this.y += p.movedY / scaleFactor; // Y軸は反転しているので+が上

            if (originalMouseDragged) originalMouseDragged(event);
        };

        const originalMouseWheel = p.mouseWheel;
        p.mouseWheel = (event) => {
            // ズームイン・アウト (ホイール回転量に応じて)
            const zoomAmount = event.delta * 0.001;
            this.zoom -= zoomAmount;
            // ズームの限界を設定
            this.zoom = this.p.constrain(this.zoom, 0.1, 10.0);

            if (originalMouseWheel) originalMouseWheel(event);
            return false; // スクロールイベントをブラウザで発生させない
        };
    }

    /**
     * WASDキーによるパン操作を更新します。
     * （p.draw内で毎フレーム呼び出してください）
     */
    update() {
        const p = this.p;
        // ズームに応じた移動スピード
        const speed = (this.baseViewRange / this.zoom) * 0.01;

        // WASDキー操作 (87=W, 83=S, 65=A, 68=D)
        if (p.keyIsDown(87)) this.y += speed;
        if (p.keyIsDown(83)) this.y -= speed;
        if (p.keyIsDown(65)) this.x -= speed;
        if (p.keyIsDown(68)) this.x += speed;
    }

    /**
     * 画面中央を原点とし、Y上向き座標系・カメラスケールを適用します。
     * （p.drawの初めの方で呼び出してください）
     */
    apply() {
        const p = this.p;
        const minDim = Math.min(p.width, p.height);
        const currentViewRange = this.baseViewRange / this.zoom;
        const scaleFactor = (minDim / 2) / currentViewRange;

        p.translate(p.width / 2, p.height / 2);

        // Y軸を反転（上方向を+）してスケールを適用
        p.scale(scaleFactor, -scaleFactor);

        // カメラの座標移動を適用
        p.translate(-this.x, -this.y);
    }
}

/**
 * 現在のビュー範囲に合わせてグリッドとXY軸、座標の数値を描画します。
 * 
 * @param {import('p5')} p - p5.jsのインスタンス
 * @param {Camera} camera - 使用中のCameraインスタンス
 * @param {number} step - グリッドの1マスのサイズ（デフォルトは10）
 * @param {string} theme - 'light' または 'dark'
 */
export function drawGrid(p, camera, step = 10, theme = 'light') {
    p.push();

    const currentViewRange = camera.baseViewRange / camera.zoom;
    // 画面全体をカバーできるように、縦横比を考慮して最大描画範囲を計算
    const maxRangeX = currentViewRange * (p.width / Math.min(p.width, p.height));
    const maxRangeY = currentViewRange * (p.height / Math.min(p.width, p.height));

    // スケールをかけたことによって線が太くならないよう、逆数で線幅を補正する係数
    const weightScale = 1 / ((Math.min(p.width, p.height) / 2) / currentViewRange);

    // テーマ色
    const isDark = theme === 'dark';
    const axisColor = isDark ? p.color(150, 150, 150, 200) : p.color(100, 100, 100, 150);
    const gridColor = isDark ? p.color(60, 60, 60, 150) : p.color(220, 220, 220, 150);
    const textColor = isDark ? p.color(200, 200, 200) : p.color(50, 50, 50);

    // 描画開始位置・終了位置
    const startX = Math.floor((camera.x - maxRangeX) / step) * step;
    const endX = Math.ceil((camera.x + maxRangeX) / step) * step;
    const startY = Math.floor((camera.y - maxRangeY) / step) * step;
    const endY = Math.ceil((camera.y + maxRangeY) / step) * step;

    // テキストの描画設定
    p.textSize(12 * weightScale);
    p.textAlign(p.CENTER, p.CENTER);

    // 数値の描画を行うヘルパー関数（Y軸が反転しているのでテキストが逆さまにならないようにする）
    const drawText = (str, x, y) => {
        p.push();
        p.translate(x, y);
        p.scale(1, -1); // テキストだけY軸を再反転
        p.fill(textColor);
        p.noStroke();
        p.text(str, 0, 0);
        p.pop();
    };

    // 縦線（X座標）
    for (let x = startX; x <= endX; x += step) {
        if (Math.abs(x) < 0.001) {
            p.stroke(axisColor);
            p.strokeWeight(2 * weightScale);
        } else {
            p.stroke(gridColor);
            p.strokeWeight(1 * weightScale);
        }
        // 線を描く
        p.line(x, camera.y - maxRangeY, x, camera.y + maxRangeY);

        // 主要な座標の数字を描く (原点付近を避けるためにY軸付近に描画)
        // ただしX=0の場合は描かない
        if (Math.abs(x) >= 0.001) {
            drawText(x.toString(), x, -step * 0.5);
        }
    }

    // 横線（Y座標）
    for (let y = startY; y <= endY; y += step) {
        if (Math.abs(y) < 0.001) {
            p.stroke(axisColor);
            p.strokeWeight(2 * weightScale);
        } else {
            p.stroke(gridColor);
            p.strokeWeight(1 * weightScale);
        }
        // 線を描く
        p.line(camera.x - maxRangeX, y, camera.x + maxRangeX, y);

        // 主要な座標の数字を描く
        if (Math.abs(y) >= 0.001) {
            drawText(y.toString(), step * 0.5, y);
        }
    }

    // 原点の数字を一つだけ描画
    drawText('0', -step * 0.5, -step * 0.5);

    p.pop();
}
