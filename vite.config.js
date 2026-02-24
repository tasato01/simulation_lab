import { resolve } from 'path';
import { defineConfig } from 'vite';
import fs from 'fs';

// sketchesディレクトリ内の全スケッチのindex.htmlを自動的にビルドの入力として抽出する
const sketchesDir = resolve(__dirname, 'sketches');
const sketchFolders = fs.existsSync(sketchesDir) ? fs.readdirSync(sketchesDir) : [];

const input = {
    main: resolve(__dirname, 'index.html'), // ルートのindex
};

// 各スケッチフォルダのindex.htmlを追加
sketchFolders.forEach((folder) => {
    const indexPath = resolve(sketchesDir, folder, 'index.html');
    if (fs.existsSync(indexPath)) {
        input[folder] = indexPath;
    }
});

export default defineConfig({
    // GitHub Pagesで公開するためのベースパス設定
    // リポジトリ名に合わせて自動設定されます（例: https://username.github.io/repo-name/）
    base: './',
    build: {
        rollupOptions: {
            input
        }
    }
});
