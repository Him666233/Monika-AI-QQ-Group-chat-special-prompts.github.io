/**
 * 动态加载提示词数据
 * 从 prompts 文件夹读取 JSON 文件
 */

// 全局变量存储加载的版本数据
let promptVersions = [];

/**
 * 加载所有提示词版本
 * @returns {Promise<Array>} 提示词版本数组
 */
async function loadPromptVersions() {
    try {
        console.log('📖 开始加载提示词版本...');
        
        // 1. 读取索引文件
        const indexResponse = await fetch('prompts/index.json');
        if (!indexResponse.ok) {
            throw new Error('无法加载 index.json');
        }
        const indexData = await indexResponse.json();
        
        console.log(`✅ 找到 ${indexData.versions.length} 个版本文件`);
        
        // 2. 加载所有版本文件
        const loadPromises = indexData.versions.map(async (filename) => {
            try {
                const response = await fetch(`prompts/${filename}`);
                if (!response.ok) {
                    console.error(`❌ 无法加载 ${filename}`);
                    return null;
                }
                const data = await response.json();
                
                // 3. 如果有promptFile字段，加载对应的txt文件
                if (data.promptFile) {
                    try {
                        const txtResponse = await fetch(`prompts/${data.promptFile}`);
                        if (txtResponse.ok) {
                            data.prompt = await txtResponse.text();
                            console.log(`   ✅ 加载 ${filename} 和 ${data.promptFile}`);
                        } else {
                            console.error(`   ⚠️ 无法加载提示词文件: ${data.promptFile}`);
                            data.prompt = '';
                        }
                    } catch (txtError) {
                        console.error(`   ⚠️ 加载提示词文件失败: ${data.promptFile}`, txtError);
                        data.prompt = '';
                    }
                } else {
                    console.log(`   ✅ 加载 ${filename}`);
                }
                
                return data;
            } catch (error) {
                console.error(`❌ 加载 ${filename} 失败:`, error);
                return null;
            }
        });
        
        // 等待所有文件加载完成
        const versions = await Promise.all(loadPromises);
        
        // 过滤掉加载失败的
        promptVersions = versions.filter(v => v !== null);
        
        // 按版本号排序
        promptVersions.sort((a, b) => {
            const versionA = parseInt(a.version);
            const versionB = parseInt(b.version);
            return versionA - versionB;
        });
        
        console.log(`✅ 成功加载 ${promptVersions.length} 个版本`);
        
        return promptVersions;
        
    } catch (error) {
        console.error('❌ 加载提示词版本失败:', error);
        return [];
    }
}

/**
 * 获取最新版本
 * @returns {Object|null} 最新版本对象
 */
function getLatestVersion() {
    return promptVersions.find(v => v.isLatest) || null;
}

/**
 * 根据版本号获取版本
 * @param {string} versionNumber 版本号
 * @returns {Object|null} 版本对象
 */
function getVersionByNumber(versionNumber) {
    return promptVersions.find(v => v.version === versionNumber) || null;
}

/**
 * 获取所有版本
 * @returns {Array} 所有版本数组
 */
function getAllVersions() {
    return promptVersions;
}

// 导出函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadPromptVersions,
        getLatestVersion,
        getVersionByNumber,
        getAllVersions
    };
}
