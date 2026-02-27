import p5 from 'p5';
import { Pane } from 'tweakpane';
import { GRAVITY } from '../../shared/physics.js';
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
const STATE = {
    omega_base: 2.0, // 基準の角速度
    radius: 3.0,     // 振り子の長さ
    theta_zero: Math.PI / 6 // 初期の振り角度
};

// 内部計算用の変数
let omega = 0;
let theta = 0;


// ==========================================
// 2. 初期化処理 (画面サイズや初期設定などを記述する場所)
// ==========================================
function setupSimulation(p) {
    // 画面初期化時やリセット時に呼ばれます
    theta = STATE.theta_zero;
    omega = 0;
}

// ==========================================
// 3. 状態の更新処理 (毎フレームの物理計算などを記述する場所)
// ==========================================
// 引数 time はシミュレーションの経過時間、deltaTime は前フレームからの経過時間
function updateSimulation(p, time, deltaTime) {
    // 回転する振り子の運動方程式の計算
    // 加速度 (acc) の算出: 重力パラメータは PARAMS.gravity を使用
    const acc = STATE.radius * (STATE.omega_base ** 2) * Math.sin(theta) * Math.cos(theta) - PARAMS.gravity * Math.sin(theta);

    // 速度・角度の積分
    omega += (acc / STATE.radius) * deltaTime;
    theta += omega * deltaTime;
}

// ==========================================
// 4. 描画処理 (円や線を描画する場所)
// ==========================================
function drawSimulation(p) {
    const isDark = PARAMS.theme === 'dark';
    const springColor = isDark ? '#aaaaaa' : '#888888';

    // 角度から x, y 座標を計算 (原点0, 0からの距離 radius)
    // 数学的に下向きを0度とするなら sin, cos を調整します（ここはY上向き座標系です）
    // - Math.PI / 2 を引くことで、theta=0の時に真下(Yのマイナス方向)に向くようにします。
    const bobX = STATE.radius * Math.cos(theta - Math.PI / 2);
    const bobY = STATE.radius * Math.sin(theta - Math.PI / 2);

    // 原点から振り子の重り(bob)までの線を描画
    drawLine(p, 0, 0, bobX, bobY, springColor, 2);

    // オブジェクト(重り)を描画。半径(radius)は描画用の大きさに調整して使います
    p.fill(PARAMS.color);
    p.noStroke();
    p.circle(bobX, bobY, PARAMS.radius * 2 / 10); // スライダのradiusが大きすぎる場合は見た目調整
}

// ==========================================
// 5. UIの追加設定 (カスタムパラメータを追加する場所)
// ==========================================
function setupUI(pane, monitorFolder) {
    // スライダーの追加 (STATE内の変数を紐付け)
    pane.addBinding(STATE, 'omega_base', { min: 0, max: 10, label: '基準角速度' });
    pane.addBinding(STATE, 'radius', { min: 0.1, max: 10, label: '振り子の長さ' });
    pane.addBinding(STATE, 'theta_zero', { min: -Math.PI, max: Math.PI, label: '初期角度(θ0)' }).on('change', () => {
        // 初期角度のスライダーをいじったら、実際のthetaにも適用する
        theta = STATE.theta_zero;
    });

    // リアルタイム変数の監視
    // getterを使って計算中の変数を読み取らせる
    monitorFolder.addBinding({ get theta() { return theta; } }, 'theta', { readonly: true, label: '現在角度(θ)' });
    monitorFolder.addBinding({ get omega() { return omega; } }, 'omega', { readonly: true, label: '現在角速度(ω)' });
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

    // リアルタイム表示用の監視オブジェクト 
    const MONITOR = {
        time: 0
    };

    p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);

        // 初期表示範囲を6としてカメラを生成
        camera = new Camera(p, 6);

        // ユーザーの初期化処理を呼ぶ
        setupSimulation(p);

        // サムネイル表示の場合はUIパネルを生成しない
        if (!isThumb) {
            // ==========================================
            // UI パネルの構築
            // ==========================================
            pane = new Pane({ title: 'パラメータ調整' });

            // --- シミュレーション操作 ---
            pane.addBinding(PARAMS, 'radius', { min: 1, max: 50, label: '描画半径' });
            pane.addBinding(PARAMS, 'gravity', { min: 0, max: 20, label: '重力' });
            pane.addBinding(PARAMS, 'color', { label: '色' });

            // --- 再生 / 一時停止 ---
            // 初期状態が true なので、ボタンラベルもそれに合わせる
            const playPauseBtn = pane.addButton({ title: '▶ 再生 (Play)' });
            playPauseBtn.on('click', () => {
                isPaused = !isPaused;
                playPauseBtn.title = isPaused ? '▶ 再生 (Play)' : '⏸ 一時停止 (Pause)';
            });

            pane.addButton({ title: '🔄 リセット (Reset)' }).on('click', () => {
                MONITOR.time = 0;
                setupSimulation(p); // リセット時にもう一度初期化処理を呼ぶ

                // ★ リセット時も一時停止状態に戻す
                isPaused = true;
                playPauseBtn.title = '▶ 再生 (Play)';
            });

            // --- リアルタイムモニター ---
            const monitorFolder = pane.addFolder({ title: '📊 リアルタイム変数', expanded: true });
            // interval: 16 にすることで、約60FPSで滑らかに数値が更新されます
            monitorFolder.addBinding(MONITOR, 'time', { readonly: true, label: '時間(t)', interval: 16 });

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
                } else {
                    document.body.style.backgroundColor = '#f7f9fc';
                    document.body.style.color = '#333';
                }
            });

            // テーマの初回適用
            if (PARAMS.theme === 'dark') {
                document.body.style.backgroundColor = '#1a1a1a';
                document.body.style.color = 'white';
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

    p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
    };
};

new p5(sketch);
