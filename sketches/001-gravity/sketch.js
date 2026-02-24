import p5 from 'p5';
import { Pane } from 'tweakpane';
// 共通の物理ルール（重力や反発係数など）を読み込む
import { GRAVITY, DEFAULT_RESTITUTION } from '../../shared/physics.js';
import { Camera, drawGrid } from '../../shared/view.js';

const currentTheme = localStorage.getItem('sim_theme') || 'light';

const PARAMS = {
    theme: currentTheme, // 'light' or 'dark'
    radius: 10,     // ボールの相対的な半径
    gravity: GRAVITY,
    // 跳ね返りやすさ。1.0で全くエネルギーを失わず、0でピタッと止まります
    restitution: DEFAULT_RESTITUTION,
    color: '#00ccff'
};

const sketch = (p) => {
    let pane;
    let camera;
    let isPaused = false;

    // リアルタイム表示用の監視オブジェクト
    const MONITOR = {
        y: 80,
        vy: 0
    };

    // ボールの状態を表す変数
    let y = 80;  // 画面の上の方（初期位置）
    let vy = 0;  // Y方向の速度

    p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);

        // 初期表示範囲を100としてカメラを生成
        camera = new Camera(p, 100);

        pane = new Pane({ title: 'Physics Settings', expanded: true });

        // --- シミュレーション操作 ---
        pane.addBinding(PARAMS, 'radius', { min: 2, max: 50, label: '半径' });
        pane.addBinding(PARAMS, 'gravity', { min: 0, max: 30, label: '重力' });
        pane.addBinding(PARAMS, 'restitution', { min: 0, max: 1, label: '反発係数' });
        pane.addBinding(PARAMS, 'color', { label: '色' });

        // --- 再生 / 一時停止 ---
        const playPauseBtn = pane.addButton({ title: '⏸ 一時停止 (Pause)' });
        playPauseBtn.on('click', () => {
            isPaused = !isPaused;
            playPauseBtn.title = isPaused ? '▶ 再生 (Play)' : '⏸ 一時停止 (Pause)';
        });

        // UIパネルにボタンを追加して、クリックされたら変数を初期化する処理
        const resetBtn = pane.addButton({ title: '🔄 リセット (Reset Ball)' });
        resetBtn.on('click', () => {
            // 現在の画面の表示範囲の上部付近へ戻す
            const currentViewRange = camera.baseViewRange;
            y = currentViewRange * 0.8;
            vy = 0;
            MONITOR.y = y;
            MONITOR.vy = vy;
        });

        // --- リアルタイムモニター ---
        const monitorFolder = pane.addFolder({ title: '📊 リアルタイム変数', expanded: true });
        // interval: 16 にすることで、約60FPSで滑らかに数値が更新されます
        monitorFolder.addBinding(MONITOR, 'y', { readonly: true, label: '高さ (y)', format: (v) => v.toFixed(2), interval: 16 });
        monitorFolder.addBinding(MONITOR, 'vy', { readonly: true, label: '速度 (vy)', format: (v) => v.toFixed(2), interval: 16 });

        // --- 設定フォルダ ---
        const settingsFolder = pane.addFolder({ title: '⚙️ 設定 (Settings)', expanded: false });

        settingsFolder.addBinding(PARAMS, 'theme', {
            options: { Light: 'light', Dark: 'dark' },
            label: '外観テーマ'
        }).on('change', (ev) => {
            localStorage.setItem('sim_theme', ev.value);
            if (ev.value === 'dark') {
                document.body.style.backgroundColor = '#1a1a1a';
                document.body.style.color = 'white';
            } else {
                document.body.style.backgroundColor = '#f7f9fc';
                document.body.style.color = '#333';
            }
        });

        if (PARAMS.theme === 'dark') {
            document.body.style.backgroundColor = '#1a1a1a';
            document.body.style.color = 'white';
        }

        // --- 共有用コピーボタン ---
        const copyBtn = settingsFolder.addButton({ title: '🔗 URLをコピー (Share)' });
        copyBtn.on('click', () => {
            navigator.clipboard.writeText(window.location.href).then(() => {
                copyBtn.title = '✅ コピーしました！';
                setTimeout(() => { copyBtn.title = '🔗 URLをコピー (Share)'; }, 2000);
            });
        });
    };

    p.draw = () => {
        if (PARAMS.theme === 'dark') {
            p.background(30, 30, 30);
        } else {
            p.background(247, 249, 252);
        }

        // --- 【重要】カメラ操作(パン・ズーム)と座標系の適用 ---
        camera.apply();

        // DESMOS風の動的グリッドを描画
        drawGrid(p, camera, PARAMS.theme);

        p.fill(PARAMS.color);
        p.noStroke();

        // --- 物理演算のステップ ---
        if (!isPaused) {
            const delta = p.deltaTime / 100;
            vy -= PARAMS.gravity * delta;
            y += vy * delta;

            // --- 衝突判定 ---
            // 床の高さは描画範囲の一番下 (-camera.baseViewRange) になります
            const floorY = -camera.baseViewRange;
            if (y - PARAMS.radius < floorY) {
                y = floorY + PARAMS.radius; // 画面外にめり込まないように補正
                vy *= -PARAMS.restitution;
            }

            // モニター用変数の更新
            MONITOR.y = y;
            MONITOR.vy = vy;
        }

        // 計算された最新のY座標を使って、X座標は0(中央)に円を描画する
        p.circle(0, y, PARAMS.radius * 2);
    };

    p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
    };
};

new p5(sketch);
