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
const currentTheme = localStorage.getItem('sim_theme') || 'light';
// URLに ?thumb=1 がついている場合はサムネイルモードとして判別
const isThumb = new URLSearchParams(window.location.search).get('thumb') === '1';

const PARAMS = {
    theme: currentTheme, // 'light' or 'dark'
    radius: 10,
    gravity: GRAVITY,
    color: '#ff0055'
};

const sketch = (p) => {
    let pane;
    let camera; // カメラインスタンス
    let isPaused = false; // シミュレーションの一時停止状態

    // リアルタイム表示用の監視オブジェクト
    const MONITOR = {
        time: 0
    };

    p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);

        // 初期表示範囲を100としてカメラを生成
        camera = new Camera(p, 100);

        // サムネイル表示の場合はUIパネルを生成しない
        if (!isThumb) {
            // ==========================================
            // UI パネルの構築
            // ==========================================
            pane = new Pane({ title: 'パラメータ調整' });

            // --- シミュレーション操作 ---
            pane.addBinding(PARAMS, 'radius', { min: 1, max: 50, label: '半径' });
            pane.addBinding(PARAMS, 'gravity', { min: 0, max: 20, label: '重力' });
            pane.addBinding(PARAMS, 'color', { label: '色' });

            // --- 再生 / 一時停止 ---
            const playPauseBtn = pane.addButton({ title: '⏸ 一時停止 (Pause)' });
            playPauseBtn.on('click', () => {
                isPaused = !isPaused;
                playPauseBtn.title = isPaused ? '▶ 再生 (Play)' : '⏸ 一時停止 (Pause)';
            });

            pane.addButton({ title: '🔄 リセット (Reset)' }).on('click', () => {
                // 必要に応じて初期化処理をここに記述
                MONITOR.time = 0;
            });

            // --- リアルタイムモニター ---
            const monitorFolder = pane.addFolder({ title: '📊 リアルタイム変数', expanded: true });
            // interval: 16 にすることで、約60FPSで滑らかに数値が更新されます
            monitorFolder.addBinding(MONITOR, 'time', { readonly: true, label: '時間(t)', interval: 16 });

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

                // ローカルホストからコピーする際もGitHub PagesのURLへ変換
                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                    // /sketches/002-test/ 等につながるパスを取得して本番URLに付与
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

        // オブジェクトの描画
        p.fill(PARAMS.color);
        p.noStroke();

        // 画面の中央(0, 0)に円を描画
        p.circle(0, Math.sin(MONITOR.time) * 20, PARAMS.radius * 2);

        // --- 物理演算の更新 ---
        if (!isPaused && !isThumb) {
            MONITOR.time += p.deltaTime / 1000;
        }

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
