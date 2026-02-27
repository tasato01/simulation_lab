import p5 from 'p5';
import { Pane } from 'tweakpane';
import { GRAVITY, toDegrees, toRadians } from '../../shared/physics.js';
// カメラクラスと共通ユーティリティを読み込む
import { Camera, drawGrid, drawLine, drawSpring } from '../../shared/view.js';

/**
 * ==========================================
 * パラメータ設定 (Tweakpane用)
 * ==========================================
 */
const currentTheme = localStorage.getItem('sim_theme') || 'light';
// URLに ?thumb=1 がついている場合はサムネイルモードとして判別
const isThumb = new URLSearchParams(window.location.search).get('thumb') === '1';

const PARAMS = {
    theme: currentTheme, // 'light' or 'dark'
    radius: 10,
    gravity: GRAVITY,
    color: '#ff0055'
};

// ==========================================
// 1. 状態変数の定義 (物体の位置や速度などを追加する場所)
// ==========================================
// 例: 回転する振り子の変数
// ユーザーがUIからいじれるようにするため、windowオブジェクトなどのプロパティにします
// (単純なlet宣言だとtweakpaneから参照しにくいため、専用のオブジェクトで包むのがおすすめです)
let STATE = {
    omega_base: 2, // リングの角速度
    radius: 1.0,     // 振り子の長さ
    theta_zero: 30 // ★ 初期の振り角度 [度数法]
};

// 内部計算用の変数
let omega = 0;
let theta = 0;
let acc = 0; // 加速度 (Monitor表示用)
let theta_base = 0.0; // リングの角度
let theta_center = 0.0; // 平衡点の角度

// ==========================================
// 2. 初期化処理 (画面サイズや初期設定などを記述する場所)
// ==========================================
function setupSimulation(p) {
    // 画面初期化時やリセット時に呼ばれます
    theta = toRadians(STATE.theta_zero);
    omega = 0;
    acc = 0;
    theta_base = 0.0;
}

// ==========================================
// 3. 状態の更新処理 (毎フレームの物理計算などを記述する場所)
// ==========================================
// 引数 time はシミュレーションの経過時間、deltaTime は前フレームからの経過時間
function updateSimulation(p, time, deltaTime) {
    // 回転する振り子の運動方程式の計算
    // 加速度 (acc) の算出: 重力パラメータは PARAMS.gravity を使用
    acc = STATE.radius * (STATE.omega_base ** 2) * Math.sin(theta) * Math.cos(theta) - PARAMS.gravity * Math.sin(theta);

    // 速度・角度の積分
    omega += (acc / STATE.radius) * deltaTime;
    theta += omega * deltaTime;
    theta_base += STATE.omega_base * deltaTime;
}

// ==========================================
// 4. 描画処理 (円や線を描画する場所)
// ==========================================
function drawSimulation(p) {
    const isDark = PARAMS.theme === 'dark';
    const springColor = isDark ? '#aaaaaa' : '#888888';

    // 変数を取り出す (STATE と PARAMS から)
    const { radius, omega_base } = STATE;
    const { gravity } = PARAMS;

    // 角度から x, y 座標を計算 (原点0, 0からの距離 radius)
    const bob1 = { x: radius * Math.cos(theta - Math.PI / 2), y: radius * Math.sin(theta - Math.PI / 2) }
    const base0 = { x: radius * Math.cos(theta_base), y: radius * Math.sin(theta_base) }
    const base1 = { x: radius * Math.cos(theta_base + Math.PI), y: radius * Math.sin(theta_base + Math.PI) }
    const bob2 = { x: base0.x * Math.cos(theta - Math.PI / 2) - radius * 3, y: base0.y * Math.cos(theta - Math.PI / 2) - radius * 3 }
    const bob3 = { x: radius * 3, y: radius * Math.sin(theta - Math.PI / 2) }
    const bob4 = { x: radius * Math.cos(theta - Math.PI / 2), y: -radius * 3 }
    const bob5 = { x: bob1.x * Math.cos(theta_base) - radius * 3, y: bob1.y }

    // 平衡点の角度計算
    const cosVal = gravity / (radius * omega_base ** 2);

    drawLine(p, 0, 0, bob1.x, bob1.y, springColor, 0.02);
    drawLine(p, base0.x - radius * 3, base0.y - radius * 3, base1.x - radius * 3, base1.y - radius * 3, springColor, 0.02);
    drawLine(p, radius * 3, -radius, radius * 3, radius, springColor, 0.02);
    drawLine(p, -radius, -radius * 3, radius, -radius * 3, springColor, 0.02);

    p.noFill();
    p.stroke(springColor);
    p.strokeWeight(0.02);
    p.circle(0, 0, radius * 2);
    p.ellipse(-radius * 3, 0, radius * 2 * Math.cos(theta_base), radius * 2);

    p.noStroke();
    p.fill('#234fe0ff');
    p.circle(0, -radius, 0.08);
    p.circle(radius * 3, -radius, 0.08);
    p.circle(-radius * 3, -radius, 0.08);
    p.circle(-radius * 3, -radius * 3, 0.08);
    p.circle(0, -radius * 3, 0.08);

    if (Math.abs(cosVal) <= 1) {
        theta_center = Math.acos(cosVal);
        p.fill('#1ab61aff'); // 平衡点は緑色に
        p.circle(radius * Math.cos(theta_center - Math.PI / 2), radius * Math.sin(theta_center - Math.PI / 2), 0.08);
        p.circle(radius * Math.cos(-theta_center - Math.PI / 2), radius * Math.sin(-theta_center - Math.PI / 2), 0.08);
        p.circle(radius * Math.cos(theta_center - Math.PI / 2) * Math.cos(theta_base) - radius * 3, radius * Math.sin(theta_center - Math.PI / 2), 0.08);
        p.circle(radius * Math.cos(-theta_center - Math.PI / 2) * Math.cos(theta_base) - radius * 3, radius * Math.sin(-theta_center - Math.PI / 2), 0.08);
        p.circle(radius * 3, radius * Math.sin(theta_center - Math.PI / 2), 0.08);
        p.circle(radius * Math.cos(theta_center - Math.PI / 2), -radius * 3, 0.08);
        p.circle(radius * Math.cos(theta_center + Math.PI / 2), -radius * 3, 0.08);
        p.circle(base0.x * Math.cos(theta_center - Math.PI / 2) - radius * 3, base0.y * Math.cos(theta_center - Math.PI / 2) - radius * 3, 0.08);
        p.circle(base0.x * Math.cos(theta_center + Math.PI / 2) - radius * 3, base0.y * Math.cos(theta_center + Math.PI / 2) - radius * 3, 0.08);
    }

    // オブジェクト(重り)を描画
    p.fill(PARAMS.color);
    p.noStroke();
    p.circle(bob1.x, bob1.y, 0.2);
    p.circle(bob2.x, bob2.y, 0.2);
    p.circle(bob3.x, bob3.y, 0.2);
    p.circle(bob4.x, bob4.y, 0.2);
    p.circle(bob5.x, bob5.y, 0.2);

}

// ==========================================
// 5. UIの追加設定 (カスタムパラメータを追加する場所)
// ==========================================
function setupUI(pane, monitorFolder) {
    // スライダーの追加 (STATE内の変数を紐付け)
    pane.addBinding(STATE, 'omega_base', { min: 0, max: 10, label: 'リングの角速度' });
    pane.addBinding(STATE, 'radius', { min: 0.1, max: 10, label: '振り子の長さ' });
    pane.addBinding(STATE, 'theta_zero', { min: 0, max: 180, label: '初期角度(θ0) [deg]' });

    // リアルタイム変数の監視
    // getterを使って計算中の変数を読み取らせる
    monitorFolder.addBinding({ get acc() { return Number(acc.toFixed(3)); } }, 'acc', { readonly: true, label: '角加速度(α)', interval: 60 });
    monitorFolder.addBinding({ get omega() { return Number(omega.toFixed(3)); } }, 'omega', { readonly: true, label: '角速度(ω)', interval: 60 });
    monitorFolder.addBinding({ get theta() { return Number(toDegrees(theta).toFixed(1)); } }, 'theta', { readonly: true, label: '角度(θ) [deg]', interval: 60 });
    monitorFolder.addBinding({ get theta_center() { return Number(toDegrees(theta_center).toFixed(1)); } }, 'theta_center', { readonly: true, label: '平衡点(θe) [deg]', interval: 60 });
}


/**
 * ==========================================
 * ここから下は基本システム（UIやカメラの設定）です。
 * 特殊な変更を行いたい場合以外は、編集不要です。
 * ==========================================
 */
const sketch = (p) => {
    let pane;
    let camera; // カメラインスタンス
    let isPaused = true; // ★ 初期状態はシミュレーションを一時停止
    let playPauseBtn; // ボタンの参照を保持

    // リアルタイム表示用の監視オブジェクト 
    const MONITOR = {
        time: 0
    };

    p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);

        // 初期表示範囲を6としてカメラを生成
        camera = new Camera(p, 4.2);

        // ユーザーの初期化処理を呼ぶ
        setupSimulation(p);

        // サムネイル表示の場合はUIパネルを生成しない
        if (!isThumb) {
            // ==========================================
            // UI パネルの構築
            // ==========================================
            pane = new Pane({ title: 'パラメータ調整' });

            // --- 再生 / 一時停止 ---
            // 初期状態が true なので、ボタンラベルもそれに合わせる
            playPauseBtn = pane.addButton({ title: '▶ 再生 (Play)' });
            playPauseBtn.on('click', () => {
                isPaused = !isPaused;
                playPauseBtn.title = isPaused ? '▶ 再生 (Play)' : '⏸ 一時停止 (Pause)';
            });

            pane.addButton({ title: '🔄 リセット (Reset)' }).on('click', () => {
                MONITOR.time = 0;
                setupSimulation(p); // リセット時にもう一度初期化処理を呼ぶ

                // ★ リセット時も一時停止状態に戻す
                isPaused = true;
                if (playPauseBtn) playPauseBtn.title = '▶ 再生 (Play)';
            });

            // --- リアルタイムモニター ---
            const monitorFolder = pane.addFolder({ title: '📊 リアルタイム変数', expanded: true });
            // interval: 50 にすることで、カクつきを抑えて数値の動きを読みやすくします
            monitorFolder.addBinding({ get time() { return Number(MONITOR.time.toFixed(3)); } }, 'time', { readonly: true, label: '時間(t)', interval: 50 });


            // ★ カスタムUI関数を呼び出し
            if (typeof setupUI === 'function') {
                setupUI(pane, monitorFolder);
            }

            // --- 設定フォルダ ---
            const settingsFolder = pane.addFolder({ title: '⚙️ 設定 (Settings)', expanded: false });

            // テーマ切り替えを設定フォルダ内に配置
            settingsFolder.addBinding(PARAMS, 'theme', {
                options: { Light: 'light', Dark: 'dark' },
                label: '外観テーマ'
            }).on('change', (ev) => {
                // ローカルストレージに保存
                localStorage.setItem('sim_theme', ev.value);
                // テーマ変更時にHTMLの背景色も合わせる
                if (ev.value === 'dark') {
                    document.body.style.backgroundColor = '#1a1a1a';
                    document.body.style.color = 'white';
                    document.body.classList.add('theme-dark');
                } else {
                    document.body.style.backgroundColor = '#f7f9fc';
                    document.body.style.color = '#333';
                    document.body.classList.remove('theme-dark');
                }
            });

            // テーマの初回適用
            if (PARAMS.theme === 'dark') {
                document.body.style.backgroundColor = '#1a1a1a';
                document.body.style.color = 'white';
                document.body.classList.add('theme-dark');
            }

            // --- 共有用コピーボタン ---
            const copyBtn = settingsFolder.addButton({ title: '🔗 URLをコピー (Share)' });
            copyBtn.on('click', () => {
                let shareUrl = window.location.href;
                // サムネイル表示用のクエリがあれば取り除く
                shareUrl = shareUrl.replace('?thumb=1', '');

                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                    shareUrl = `https://tasato01.github.io/simulation_lab${window.location.pathname}`;
                }

                navigator.clipboard.writeText(shareUrl).then(() => {
                    copyBtn.title = '✅ コピーしました！';
                    setTimeout(() => { copyBtn.title = '🔗 URLをコピー (Share)'; }, 2000);
                });
            });
        }
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

        // --- 物理演算の更新 ---
        if (!isPaused && !isThumb) {
            MONITOR.time += p.deltaTime / 1000;
            // ユーザーが定義した更新処理を呼び出す
            updateSimulation(p, MONITOR.time, p.deltaTime / 1000);
        }

        // --- 描画処理 ---
        drawSimulation(p);

        // サムネイル時は1フレームだけ描画してループを停止することで負荷を軽減
        if (isThumb) {
            p.noLoop();
        }
    };

    // キーボード操作のフック
    p.keyPressed = () => {
        if (p.key === ' ') {
            // スペースキーで再生/一時停止
            isPaused = !isPaused;
            if (playPauseBtn) playPauseBtn.title = isPaused ? '▶ 再生 (Play)' : '⏸ 一時停止 (Pause)';
        }
        if (p.key === 'r' || p.key === 'R') {
            // Rキーでリセット
            MONITOR.time = 0;
            setupSimulation(p);
            isPaused = true;
            if (playPauseBtn) playPauseBtn.title = '▶ 再生 (Play)';
        }
    };

    p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
    };
};

new p5(sketch);
