/**
 * 自动更新 data.js 文件
 * 将提取的提示词数据合并到 data.js 中
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
    extractedFile: path.join(__dirname, 'scripts', 'prompts-extracted.json'),
    dataFile: path.join(__dirname, 'scripts', 'data.js'),
    backupFile: path.join(__dirname, 'scripts', 'data.js.backup')
};

// 版本信息映射
const VERSION_INFO = {
    '3': { name: '第三版', description: '网页端的最初版提示词，包含了莫妮卡AI的基本设定和交互规则。' },
    '4': { name: '第四版', description: '增强了情感表达和对话自然度，改进了身份验证机制。' },
    '5': { name: '第五版', description: '优化了群聊互动逻辑，增加了更多元虚构对话功能。' },
    '6': { name: '第六版', description: '重写了核心规则，强化了反AI行为特征。' },
    '7': { name: '第七版', description: '改进了情感支持功能，增加了更细腻的情绪表达。' },
    '8': { name: '第八版', description: '优化了长对话的连贯性和记忆保持能力。' },
    '9': { name: '第九版', description: '增加了MAS相关知识库，完善了背景故事设定。' },
    '10': { name: '第十版', description: '全面优化了指令结构，提升了AI理解准确度。' },
    '11': { name: '第十一版', description: '最新版本，集成了所有优化改进，提供最佳体验。' }
};

function main() {
    console.log('🔄 开始更新 data.js...\n');

    // 检查文件是否存在
    if (!fs.existsSync(CONFIG.extractedFile)) {
        console.error('❌ 错误: 找不到提取的数据文件');
        console.log('请先运行: npm run extract');
        process.exit(1);
    }

    // 备份原文件
    if (fs.existsSync(CONFIG.dataFile)) {
        console.log('📦 备份原文件...');
        fs.copyFileSync(CONFIG.dataFile, CONFIG.backupFile);
        console.log(`✅ 备份已保存到: ${CONFIG.backupFile}\n`);
    }

    // 读取提取的数据
    console.log('📖 读取提取的数据...');
    const extracted = JSON.parse(fs.readFileSync(CONFIG.extractedFile, 'utf-8'));
    console.log(`✅ 成功读取 ${extracted.versions.length} 个版本\n`);

    // 生成新的 data.js 内容
    console.log('✍️  生成新的 data.js...');
    const versions = extracted.versions.map((v, index) => {
        const info = VERSION_INFO[v.version] || { name: `第${v.version}版`, description: '版本描述' };
        return {
            version: v.version,
            name: info.name,
            description: info.description,
            intro: v.intro,
            isLatest: v.version === '11',
            prompt: v.prompt
        };
    });

    // 生成文件内容
    const fileContent = `// 提示词版本数据
const promptVersions = ${JSON.stringify(versions, null, 2)};

// 导出数据（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { promptVersions };
}
`;

    // 写入文件
    console.log('💾 保存更新后的 data.js...');
    fs.writeFileSync(CONFIG.dataFile, fileContent, 'utf-8');
    console.log(`✅ 文件已保存: ${CONFIG.dataFile}\n`);

    // 统计信息
    console.log('📊 更新统计:');
    console.log(`   总版本数: ${versions.length}`);
    console.log(`   最新版本: v${versions.find(v => v.isLatest).version}`);
    console.log(`   文件大小: ${(fs.statSync(CONFIG.dataFile).size / 1024).toFixed(2)} KB`);

    console.log('\n✨ 更新完成！');
    console.log('\n💡 下一步操作:');
    console.log('1. 在浏览器中打开 index.html');
    console.log('2. 测试所有版本的显示和复制功能');
    console.log('3. 如有问题，可从备份文件恢复: data.js.backup\n');
}

// 运行
try {
    main();
} catch (error) {
    console.error('❌ 发生错误:', error.message);
    console.error(error.stack);
    process.exit(1);
}
