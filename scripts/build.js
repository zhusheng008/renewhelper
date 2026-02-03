// scripts/build.js
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

// 读取 package.json 获取版本号
const packageJson = require('../package.json');
const APP_VERSION = packageJson.version || '1.0.0';

async function build() {
    console.log(`🚀 开始构建 v${APP_VERSION} (安全模式)...`);

    // --- 1. 处理 HTML ---
    const htmlPath = path.join(__dirname, '../src/frontend/index.html');
    const tempJsPath = path.join(__dirname, '../src/html-template.js');

    console.log('📄 读取并处理 HTML...');
    let htmlContent = fs.readFileSync(htmlPath, 'utf-8');

    // 步骤 A: 替换版本号变量
    htmlContent = htmlContent.replace(/\$\{APP_VERSION\}/g, `v${APP_VERSION}`);

    // 步骤 C: 生成 JS 字符串
    const jsContent = `export const HTML = ${JSON.stringify(htmlContent)};`;

    fs.writeFileSync(tempJsPath, jsContent);

    // --- 2. 打包 Backend (Worker 代码依然会被 esbuild 压缩，这是安全的) ---
    console.log('📦 打包 Worker 到根目录...');
    try {
        await esbuild.build({
            entryPoints: [path.join(__dirname, '../src/backend/index.js')],
            bundle: true,
            minify: true, // 后端代码压缩没问题
            outfile: path.join(__dirname, '../_worker.js'),
            format: 'esm',
            target: 'es2020',
            charset: 'utf8',
            define: { 'process.env.NODE_ENV': '"production"' }
        });
    } catch (e) {
        console.error('❌ 打包失败:', e);
        process.exit(1);
    } finally {
        // --- 3. 清理临时文件 ---
        if (fs.existsSync(tempJsPath)) {
            fs.unlinkSync(tempJsPath);
        }
    }

    console.log('✅ 构建完成! 请重新部署 _worker.js');
}

build();