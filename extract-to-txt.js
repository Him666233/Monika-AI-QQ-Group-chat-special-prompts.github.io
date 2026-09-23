/**
 * 将JSON文件中的提示词内容提取到独立的txt文件
 * 保留原有格式（换行、空格等）
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
    promptsDir: path.join(__dirname, 'prompts'),
    textsDir: path.join(__dirname, 'prompts', 'texts')
};

function main() {
    console.log('🔄 开始提取提示词到txt文件...\n');

    // 确保texts目录存在
    if (!fs.existsSync(CONFIG.textsDir)) {
        fs.mkdirSync(CONFIG.textsDir, { recursive: true });
        console.log('✅ 创建 prompts/texts 目录\n');
    }

    // 读取所有JSON文件
    const files = fs.readdirSync(CONFIG.promptsDir)
        .filter(f => f.startsWith('v') && f.endsWith('.json'));

    console.log(`📖 找到 ${files.length} 个版本文件\n`);

    let successCount = 0;
    let updateCount = 0;

    for (const filename of files) {
        const jsonPath = path.join(CONFIG.promptsDir, filename);
        const versionNum = filename.replace('v', '').replace('.json', '');
        const txtFilename = `v${versionNum}.txt`;
        const txtPath = path.join(CONFIG.textsDir, txtFilename);
        
        try {
            console.log(`📝 处理 ${filename}...`);
            
            // 读取JSON
            const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
            const data = JSON.parse(jsonContent);
            
            // 如果有prompt字段，提取到txt
            if (data.prompt) {
                // 写入txt文件（保留原格式）
                fs.writeFileSync(txtPath, data.prompt, 'utf-8');
                console.log(`   ✅ 创建 ${txtFilename} (${data.prompt.length} 字符)`);
                
                // 更新JSON文件，将prompt改为promptFile
                data.promptFile = `texts/${txtFilename}`;
                delete data.prompt;
                
                fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf-8');
                console.log(`   ✅ 更新 ${filename} (添加promptFile字段)`);
                
                successCount++;
                updateCount++;
            } else if (data.promptFile) {
                console.log(`   ⏭️ 跳过（已有promptFile字段）`);
            } else {
                console.log(`   ⚠️ 警告：没有prompt字段`);
            }
            
        } catch (error) {
            console.error(`   ❌ 处理失败:`, error.message);
        }
        
        console.log('');
    }

    console.log('📊 提取完成！');
    console.log(`   成功提取: ${successCount} 个文件`);
    console.log(`   更新JSON: ${updateCount} 个文件`);
    console.log(`   txt文件位置: ${CONFIG.textsDir}\n`);

    console.log('💡 下一步操作:');
    console.log('1. 检查 prompts/texts 目录中的txt文件');
    console.log('2. 刷新浏览器测试');
    console.log('3. 删除或重命名旧的 scripts/data.js\n');
}

// 运行
try {
    main();
} catch (error) {
    console.error('❌ 发生错误:', error.message);
    console.error(error.stack);
    process.exit(1);
}
