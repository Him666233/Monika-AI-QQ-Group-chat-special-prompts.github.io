/**
 * 提示词提取脚本
 * 用于从原始 index.html 文件中提取所有版本的提示词内容
 * 
 * 使用方法：
 * node extract-prompts.js
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
    sourceFile: path.join(__dirname, '..', 'index.html'),
    outputFile: path.join(__dirname, 'scripts', 'prompts-extracted.json'),
    versions: [3, 4, 5, 6, 7, 8, 9, 10, 11]
};

// HTML实体解码
function decodeHTML(html) {
    return html
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ');
}

// 提取单个版本的信息
function extractVersionInfo(html, versionNum) {
    try {
        // 提取更新简介
        const introRegex = new RegExp(
            `<div id="modal-v${versionNum}"[\\s\\S]*?<div class="update-intro">\\s*<h3>更新简介</h3>\\s*<p>([\\s\\S]*?)</p>`,
            'i'
        );
        const introMatch = html.match(introRegex);
        const intro = introMatch ? decodeHTML(introMatch[1].trim()) : '';

        // 提取提示词内容
        const promptRegex = new RegExp(
            `<div id="modal-v${versionNum}"[\\s\\S]*?<div class="modal-prompt-content">([\\s\\S]*?)</div>\\s*</div>\\s*</div>\\s*</div>`,
            'i'
        );
        const promptMatch = html.match(promptRegex);
        let prompt = '';
        
        if (promptMatch && promptMatch[1]) {
            prompt = decodeHTML(promptMatch[1].trim())
                .replace(/^\s+/gm, '') // 移除每行开头的空白
                .replace(/\n{3,}/g, '\n\n'); // 合并多个空行
        }

        return {
            version: versionNum.toString(),
            intro: intro,
            prompt: prompt,
            extracted: !!prompt
        };
    } catch (error) {
        console.error(`提取版本 ${versionNum} 时出错:`, error.message);
        return {
            version: versionNum.toString(),
            intro: '',
            prompt: '',
            extracted: false,
            error: error.message
        };
    }
}

// 主函数
function main() {
    console.log('🚀 开始提取提示词...\n');

    // 检查源文件是否存在
    if (!fs.existsSync(CONFIG.sourceFile)) {
        console.error('❌ 错误: 找不到源文件:', CONFIG.sourceFile);
        console.log('请确保 index.html 文件存在于正确的位置。');
        process.exit(1);
    }

    // 读取HTML文件
    console.log('📖 正在读取源文件...');
    const html = fs.readFileSync(CONFIG.sourceFile, 'utf-8');
    console.log(`✅ 文件大小: ${(html.length / 1024).toFixed(2)} KB\n`);

    // 提取所有版本
    const results = [];
    for (const versionNum of CONFIG.versions) {
        console.log(`📝 提取版本 ${versionNum}...`);
        const versionData = extractVersionInfo(html, versionNum);
        results.push(versionData);
        
        if (versionData.extracted) {
            console.log(`   ✅ 成功 (${versionData.prompt.length} 字符)`);
        } else {
            console.log(`   ❌ 失败: ${versionData.error || '未找到内容'}`);
        }
    }

    // 保存结果
    console.log('\n💾 保存提取结果...');
    const output = {
        extractedAt: new Date().toISOString(),
        totalVersions: results.length,
        successCount: results.filter(r => r.extracted).length,
        versions: results
    };

    fs.writeFileSync(CONFIG.outputFile, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`✅ 结果已保存到: ${CONFIG.outputFile}`);

    // 统计信息
    console.log('\n📊 提取统计:');
    console.log(`   总版本数: ${output.totalVersions}`);
    console.log(`   成功提取: ${output.successCount}`);
    console.log(`   失败数量: ${output.totalVersions - output.successCount}`);

    // 生成data.js更新建议
    console.log('\n💡 下一步操作:');
    console.log('1. 查看提取结果: prompts-extracted.json');
    console.log('2. 打开 scripts/data.js');
    console.log('3. 将提取的 prompt 内容复制到对应版本的 prompt 字段');
    console.log('4. 更新每个版本的 intro 字段');
    console.log('5. 在浏览器中测试网站功能\n');

    console.log('✨ 提取完成!');
}

// 运行
try {
    main();
} catch (error) {
    console.error('❌ 发生错误:', error);
    process.exit(1);
}
