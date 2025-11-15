/**
 * 将现有的 data.js 转换为独立的 JSON 文件
 * 每个版本一个文件
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
    dataFile: path.join(__dirname, 'scripts', 'data.js'),
    promptsDir: path.join(__dirname, 'prompts'),
    indexFile: path.join(__dirname, 'prompts', 'index.json')
};

function main() {
    console.log('🔄 开始转换 data.js 到独立 JSON 文件...\n');

    // 确保 prompts 目录存在
    if (!fs.existsSync(CONFIG.promptsDir)) {
        fs.mkdirSync(CONFIG.promptsDir);
        console.log('✅ 创建 prompts 目录\n');
    }

    // 读取 data.js
    console.log('📖 读取 data.js...');
    const dataContent = fs.readFileSync(CONFIG.dataFile, 'utf-8');
    
    // 提取 promptVersions 数组
    const match = dataContent.match(/const promptVersions = (\[[\s\S]*?\]);/);
    if (!match) {
        console.error('❌ 无法找到 promptVersions 数组');
        process.exit(1);
    }

    // 解析 JSON（需要处理模板字符串）
    let jsonStr = match[1];
    const versions = eval('(' + jsonStr + ')');
    
    console.log(`✅ 找到 ${versions.length} 个版本\n`);

    // 为每个版本创建单独的 JSON 文件
    const versionFiles = [];
    
    for (const version of versions) {
        const filename = `v${version.version}.json`;
        const filepath = path.join(CONFIG.promptsDir, filename);
        
        console.log(`📝 创建 ${filename}...`);
        
        // 写入 JSON 文件
        fs.writeFileSync(filepath, JSON.stringify(version, null, 2), 'utf-8');
        
        versionFiles.push(filename);
        console.log(`   ✅ 成功 (${(fs.statSync(filepath).size / 1024).toFixed(2)} KB)`);
    }

    // 创建 index.json
    console.log('\n📝 创建 index.json...');
    const indexData = {
        versions: versionFiles
    };
    fs.writeFileSync(CONFIG.indexFile, JSON.stringify(indexData, null, 2), 'utf-8');
    console.log('✅ index.json 创建成功\n');

    // 统计信息
    console.log('📊 转换完成！');
    console.log(`   总版本数: ${versions.length}`);
    console.log(`   文件位置: ${CONFIG.promptsDir}`);
    console.log(`   索引文件: index.json\n`);

    console.log('💡 下一步操作:');
    console.log('1. 检查 prompts 目录中的 JSON 文件');
    console.log('2. 运行 npm run update-loader 更新加载器');
    console.log('3. 在浏览器中测试\n');
}

// 运行
try {
    main();
} catch (error) {
    console.error('❌ 发生错误:', error.message);
    console.error(error.stack);
    process.exit(1);
}
