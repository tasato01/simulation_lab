const fs = require('fs');
const path = require('path');

const sketchName = process.argv[2];

if (!sketchName) {
    console.error('Please provide a sketch name. \nExample: npm run new 002-collision');
    process.exit(1);
}

const rootDir = path.resolve(__dirname, '..');
const templateDir = path.join(rootDir, 'templates', 'basic-p5');
const targetDir = path.join(rootDir, 'sketches', sketchName);

if (fs.existsSync(targetDir)) {
    console.error(`Sketch "${sketchName}" already exists!`);
    process.exit(1);
}

// フォルダ作成とコピー
fs.mkdirSync(targetDir, { recursive: true });
fs.copyFileSync(
    path.join(templateDir, 'index.html'),
    path.join(targetDir, 'index.html')
);
fs.copyFileSync(
    path.join(templateDir, 'sketch.js'),
    path.join(targetDir, 'sketch.js')
);

// タイトルを置換
const indexHtmlPath = path.join(targetDir, 'index.html');
let html = fs.readFileSync(indexHtmlPath, 'utf8');
html = html.replace('<title>Basic p5.js Sketch</title>', `<title>${sketchName} - Simulation Lab</title>`);
fs.writeFileSync(indexHtmlPath, html);

// ルートのindex.htmlにリンクを追加
const rootIndexPath = path.join(rootDir, 'index.html');
if (fs.existsSync(rootIndexPath)) {
    let rootHtml = fs.readFileSync(rootIndexPath, 'utf8');
    const linkStr = `<li><a href="./sketches/${sketchName}/">${sketchName}</a></li>\n      <!-- 新しいスケッチはここに追加されます -->`;
    rootHtml = rootHtml.replace('<!-- 新しいスケッチはここに追加されます -->', linkStr);
    fs.writeFileSync(rootIndexPath, rootHtml);
}

console.log(`\n✨ Sketch "${sketchName}" created successfully!`);
console.log(`\n💡 Tip: You can run this command in a **NEW terminal window** without stopping your 'npm run dev' server.`);
console.log(`Vite will automatically detect the new HTML files and links!\n`);
