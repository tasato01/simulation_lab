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

        const originalMouseDragged = p.mouseDragged;
        p.mouseDragged = (event) => {
            // Tweakpaneの操作中はカメラを動かさない (UIの幅を約320pxと想定し左側をガード)
            if (p.mouseX < 320 && p.mouseY < 600) {
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
            // ズームイン・アウト (スクロール量に応じた指数関数的変化で、一定のズーム感覚にします)
            // event.deltaが正ならズームアウト（縮小）、負ならズームイン（拡大）
            // ホイールの1刻み(約100)で約5%ズームが変化するように調整
            const zoomFactor = Math.pow(1.0005, -event.delta);
            const newZoom = this.zoom * zoomFactor;

            // ズームの限界をほぼ無限に設定
            this.zoom = this.p.constrain(newZoom, 1e-10, 1e10);

            if (originalMouseWheel) originalMouseWheel(event);
            return false; // スクロールイベントをブラウザで発生させない
        };
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
 * 現在のビュー範囲に合わせてグリッドとXY軸、座標の数値をDESMOS風に描画します。
 * 
 * @param {import('p5')} p - p5.jsのインスタンス
 * @param {Camera} camera - 使用中のCameraインスタンス
 * @param {string} theme - 'light' または 'dark'
 */
export function drawGrid(p, camera, theme = 'light') {
    p.push();

    // サムネイル表示モードかどうかを判定
    const isThumb = new URLSearchParams(window.location.search).get('thumb') === '1';

    const currentViewRange = camera.baseViewRange / camera.zoom;

    // 画面の短い方の次元を基準に、画面内に描画したい理想的な主グリッド数(例：約10個)から
    // ズーム具合に応じた適切な粗さのstep(目盛り幅)を動的に計算します。
    const idealCellCount = 8;
    const rawStep = (currentViewRange * 2) / idealCellCount;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const residual = rawStep / magnitude;

    let step = magnitude;
    if (residual > 5) {
        step = 5 * magnitude;
    } else if (residual > 2) {
        step = 2 * magnitude;
    }

    // 画面全体をカバーできるように、縦横比を考慮して最大描画範囲を計算
    const maxRangeX = currentViewRange * (p.width / Math.min(p.width, p.height));
    const maxRangeY = currentViewRange * (p.height / Math.min(p.width, p.height));

    // スケールをかけたことによって線が太くならないよう、逆数で線幅を補正する係数
    const weightScale = 1 / ((Math.min(p.width, p.height) / 2) / currentViewRange);

    // テーマ色
    const isDark = theme === 'dark';
    const axisColor = isDark ? p.color(150, 150, 150, 200) : p.color(100, 100, 100, 180);
    const gridColor = isDark ? p.color(60, 60, 60, 120) : p.color(220, 220, 220, 150);
    const minorGridColor = isDark ? p.color(40, 40, 40, 80) : p.color(240, 240, 240, 100);
    const textColor = isDark ? p.color(200, 200, 200) : p.color(50, 50, 50);

    // 描画開始位置・終了位置
    const startX = Math.floor((camera.x - maxRangeX) / step) * step;
    const endX = Math.ceil((camera.x + maxRangeX) / step) * step;
    const startY = Math.floor((camera.y - maxRangeY) / step) * step;
    const endY = Math.ceil((camera.y + maxRangeY) / step) * step;

    // テキストの描画設定
    p.textSize(14 * weightScale);
    p.textAlign(p.CENTER, p.CENTER);

    // 文字が軸から視覚的に常にピクセル単位で同じ距離にあるようにオフセットを計算
    const textOffset = 15 * weightScale;

    // 数字フォーマット（スケールの細かさに応じて小数点以下の表示桁数を動的に変更する）
    const formatNumber = (num) => {
        // stepの値(10, 1, 0.1, 0.01...) を元に、必要な小数点以下の桁数を計算する
        // stepが1以上なら0桁、0.1なら1桁、0.01なら2桁を表示
        const decimalPlaces = Math.max(0, -Math.floor(Math.log10(step)));
        return num.toFixed(decimalPlaces);
    };

    // 数値の描画を行うヘルパー関数（Y軸が反転しているのでテキストが逆さまにならないようにする）
    const drawText = (str, x, y, alignX, alignY) => {
        if (isThumb) return; // サムネイル時はテキスト非表示
        p.push();
        p.translate(x, y);
        p.scale(1, -1); // テキストだけY軸を再反転
        p.textAlign(alignX, alignY);
        p.fill(textColor);
        p.noStroke();
        p.text(str, 0, 0);
        p.pop();
    };

    // ----- 副グリッド（1段階細かい）の描画 -----
    const minorStep = step / 5;
    p.stroke(minorGridColor);
    p.strokeWeight(1 * weightScale);
    const minorStartX = Math.floor((camera.x - maxRangeX) / minorStep) * minorStep;
    const minorEndX = Math.ceil((camera.x + maxRangeX) / minorStep) * minorStep;
    for (let x = minorStartX; x <= minorEndX; x += minorStep) {
        if (Math.abs(x) > 0.001 && Math.abs(x % step) > 0.001) p.line(x, camera.y - maxRangeY, x, camera.y + maxRangeY);
    }
    const minorStartY = Math.floor((camera.y - maxRangeY) / minorStep) * minorStep;
    const minorEndY = Math.ceil((camera.y + maxRangeY) / minorStep) * minorStep;
    for (let y = minorStartY; y <= minorEndY; y += minorStep) {
        if (Math.abs(y) > 0.001 && Math.abs(y % step) > 0.001) p.line(camera.x - maxRangeX, y, camera.x + maxRangeX, y);
    }

    // ----- 主グリッドと軸・テキストの描画 -----

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

        // X軸の数値を描画（X座標が0でない場合）
        // Y=0 の軸のすぐ下に描画するか、Y=0が画面外なら画面の下端・上端に描画
        if (Math.abs(x) >= 0.001) {
            let yPos = 0 - textOffset;
            // もしY=0軸が画面より下なら画面下部に張り付ける
            if (camera.y - maxRangeY > 0) yPos = camera.y - maxRangeY + textOffset * 1.5;
            // もしY=0軸が画面より上なら画面上部に張り付ける
            if (camera.y + maxRangeY < 0) yPos = camera.y + maxRangeY - textOffset * 1.5;

            drawText(formatNumber(x), x, yPos, p.CENTER, p.TOP);
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

        // Y軸の数値を描画（Y座標が0でない場合）
        if (Math.abs(y) >= 0.001) {
            let xPos = 0 - textOffset; // 文字を軸の左側に配置
            if (camera.x - maxRangeX > 0) xPos = camera.x - maxRangeX + textOffset * 1.5;
            if (camera.x + maxRangeX < 0) xPos = camera.x + maxRangeX - textOffset * 1.5;

            drawText(formatNumber(y), xPos, y, p.RIGHT, p.CENTER);
        }
    }

    // 原点 (0,0) を描画
    {
        let oX = Math.max(camera.x - maxRangeX + textOffset, Math.min(0 - textOffset * 0.5, camera.x + maxRangeX - textOffset));
        let oY = Math.max(camera.y - maxRangeY + textOffset, Math.min(0 - textOffset * 0.5, camera.y + maxRangeY - textOffset));
        drawText('0', oX, oY, p.RIGHT, p.TOP);
    }

    p.pop();
}

/**
 * 2点を結ぶ線分を簡単に描画します。
 * @param {import('p5')} p - p5.jsのインスタンス 
 * @param {number} x1 - 始点X
 * @param {number} y1 - 始点Y
 * @param {number} x2 - 終点X
 * @param {number} y2 - 終点Y
 * @param {string} color - 線の色 (例: '#000000')
 * @param {number} weight - 線の太さ (デフォルト: 2)
 */
export function drawLine(p, x1, y1, x2, y2, color = '#000000', weight = 2) {
    p.push();
    p.stroke(color);
    p.strokeWeight(weight);
    p.line(x1, y1, x2, y2);
    p.pop();
}

/**
 * 2点間を結ぶサイン波の「ばね」を描画します。
 * @param {import('p5')} p - p5.jsのインスタンス
 * @param {number} x1 - 始点X
 * @param {number} y1 - 始点Y
 * @param {number} x2 - 終点X
 * @param {number} y2 - 終点Y
 * @param {number} waves - サイン波の波の数 (デフォルト: 10)
 * @param {number} width - ばねの振幅幅 (デフォルト: 2)
 * @param {string} color - ばねの色 (例: '#888888')
 * @param {number} weight - ばねの線の太さ (デフォルト: 2)
 */
export function drawSpring(p, x1, y1, x2, y2, waves = 10, width = 2, color = '#888888', weight = 0.1) {
    p.push();
    p.stroke(color);
    p.strokeWeight(weight);
    p.noFill();

    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    // 2点の角度を求める
    const angle = Math.atan2(dy, dx);

    // 描画の基準を(x1, y1)に移動し、終点に向けて回転させる
    p.translate(x1, y1);
    p.rotate(angle);

    p.beginShape();
    // 始点
    p.vertex(0, 0);
    // 直線部分 (始点側)
    const straightLen = distance * 0.1; // 全体の10%はまっすぐな線にする
    p.vertex(straightLen, 0);

    // サイン波部分
    const springLen = distance - straightLen * 2;
    // 描画品質のための分割数（波1つにつき約20分割）
    const resolution = Math.max(20, waves * 20);

    for (let i = 0; i <= resolution; i++) {
        // 0.0 から 1.0 までの進行度
        const t = i / resolution;

        const x = straightLen + springLen * t;
        // 進行度t に対して waves 回分のサイン波を描く (1波 = 2*PI)
        const y = Math.sin(t * waves * Math.PI * 2) * (width / 2);
        p.vertex(x, y);
    }

    // 直線部分 (終点側)
    p.vertex(distance - straightLen, 0);
    // 終点
    p.vertex(distance, 0);

    p.endShape();
    p.pop();
}
