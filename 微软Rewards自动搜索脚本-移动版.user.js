// ==UserScript==
// @name         微软Rewards自动搜索脚本 - 个人优化版
// @version      1.4.1
// @description  微软Rewards自动搜索获取积分 - 个人优化版本：45秒间隔，每5次暂停4分钟，避免检测
// @author       个人维护版本
// @match        https://*.bing.com/*
// @license      MIT
// @icon         https://www.bing.com/favicon.ico
// @connect      gumengya.com
// @run-at       document-end
// @note         个人优化版本 - 2025年8月14日更新
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @grant        GM_openInTab
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @namespace    personal-rewards-script
// ==/UserScript==

/*
 * 微软Rewards自动搜索脚本 - 个人优化版
 * 
 * 主要优化：
 * - 搜索间隔：固定45秒，避免过于频繁
 * - 暂停机制：每执行5次搜索暂停4分钟，降低被检测风险
 * - 首页优化：避免在br_msg=Please-Wait页面卡住
 * - 移除远程更新：脱离原作者更新，个人维护版本
 * - 每日进度缓存：支持跨浏览器会话的进度保存，每日自动重置
 * - 立即执行：点击开始后立即执行第一次搜索，无需等待延迟
 * - 智能搜索词：自动获取微博、知乎、百度等热搜，避免重复搜索
 * - 次数标识：每个搜索词自动添加次数后缀，增加搜索多样性
 * - 双模式选择：快速模式（无暂停）和安全模式（每5次暂停4分钟）
 * - 多源组合：从百度、微博、头条、抖音各取8条热搜，组合成30条搜索词
 * 
 * 使用说明：
 * 1. 在Stay app中安装此脚本
 * 2. 打开Bing搜索页面
 * 3. 点击油猴菜单中的"开始"按钮
 * 4. 脚本会立即执行第一次搜索，然后自动继续
 * 5. 可通过"查看今日进度"菜单查看执行情况
 * 6. 支持跨会话进度保存，关闭浏览器后重新打开会继续之前的进度
 * 
 * 注意事项：
 * - 请合理使用，避免过度刷取积分
 * - 建议在非高峰时段使用
 * - 如遇异常请手动停止脚本
 */

var max_rewards = 30; //每日总执行次数
//每执行5次搜索后插入暂停时间,解决账号被监控不增加积分的问题
var pause_time = 240000; // 暂停时长4分钟 (240000毫秒=4分钟)
var enable_pause = false; // 是否启用暂停功能，默认关闭

// 获取今日日期字符串，用于每日重置计数
function getTodayKey() {
    const today = new Date();
    return today.getFullYear() + '-' + (today.getMonth() + 1).toString().padStart(2, '0') + '-' + today.getDate().toString().padStart(2, '0');
}

// 获取今日已执行次数
function getTodayCount() {
    const todayKey = getTodayKey();
    const savedData = GM_getValue('dailyProgress', '{}');
    const progressData = JSON.parse(savedData);
    return progressData[todayKey] || 0;
}

// 保存今日执行次数
function saveTodayCount(count) {
    const todayKey = getTodayKey();
    const savedData = GM_getValue('dailyProgress', '{}');
    const progressData = JSON.parse(savedData);
    progressData[todayKey] = count;

    // 清理7天前的数据，避免存储过多
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoffKey = sevenDaysAgo.getFullYear() + '-' + (sevenDaysAgo.getMonth() + 1).toString().padStart(2, '0') + '-' + sevenDaysAgo.getDate().toString().padStart(2, '0');

    Object.keys(progressData).forEach(key => {
        if (key < cutoffKey) {
            delete progressData[key];
        }
    });

    GM_setValue('dailyProgress', JSON.stringify(progressData));
}
var search_words = []; //搜索词
var appkey = "b7a782741f667201b54880c925faec4b";// 从https://www.gmya.net/api 网站申请的热门词接口APIKEY

// 使用故梦热门词API接口
var hotSearchAPI = {
    name: "故梦热门词API",
    url: "https://api.gmya.net/Api/",
    sources: ['BaiduHot', 'WeiBoHot', 'TouTiaoHot', 'DouYinHot'],
    parser: (data) => data.data && data.data.map(item => item.title)
};

var default_search_words = [
    "人工智能发展趋势", "新能源汽车技术", "量子计算突破", "5G网络应用", "区块链技术创新",
    "元宇宙概念解析", "机器学习算法", "云计算服务", "物联网应用", "大数据分析",
    "网络安全防护", "移动支付发展", "电商平台创新", "在线教育模式", "远程办公趋势",
    "智能家居系统", "无人驾驶技术", "虚拟现实体验", "增强现实应用", "生物识别技术",
    "绿色能源发展", "环保科技创新", "可持续发展", "数字化转型", "智慧城市建设",
    "医疗科技进步", "基因编辑技术", "精准医疗", "健康管理系统", "运动科学研究"
];

// 生成带次数后缀的搜索词
function generateSearchWord(baseWord, searchCount) {
    const suffixes = [
        " 第" + searchCount + "次",
        " " + searchCount + "号",
        " 搜索" + searchCount,
        " #" + searchCount,
        " (" + searchCount + ")",
        " 查询" + searchCount,
        " 了解" + searchCount,
        " 研究" + searchCount
    ];
    const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    return baseWord + randomSuffix;
}

//获取热门搜索词的函数
function getHotSearchWords() {
    return new Promise((resolve) => {
        console.log("开始获取热门搜索词...");

        const allWords = [];
        const sources = hotSearchAPI.sources;
        let completedRequests = 0;
        let successfulRequests = 0;

        // 为每个数据源发送请求
        sources.forEach((source, index) => {
            let url = hotSearchAPI.url + source;
            if (appkey) {
                url += "?format=json&appkey=" + appkey;
            }

            console.log(`请求 ${source}:`, url);

            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                timeout: 8000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
                },
                onload: function (response) {
                    completedRequests++;

                    try {
                        if (response.status === 200) {
                            const data = JSON.parse(response.responseText);
                            const words = hotSearchAPI.parser(data);

                            if (words && words.length > 0) {
                                // 过滤并取前8条
                                const filteredWords = words.filter(word =>
                                    word && word.length >= 2 && word.length <= 20 &&
                                    !word.includes('http') && !word.includes('www') &&
                                    !word.includes('undefined') && word.trim() !== ''
                                ).slice(0, 8);

                                if (filteredWords.length > 0) {
                                    allWords.push(...filteredWords);
                                    successfulRequests++;
                                    console.log(`✅ ${source} 成功获取 ${filteredWords.length} 条词汇`);
                                }
                            }
                        } else {
                            console.log(`❌ ${source} HTTP错误:`, response.status);
                        }
                    } catch (error) {
                        console.log(`❌ ${source} 解析失败:`, error.message);
                    }

                    // 检查是否所有请求都完成
                    checkCompletion();
                },
                onerror: function (error) {
                    completedRequests++;
                    console.log(`❌ ${source} 请求失败:`, error);
                    checkCompletion();
                },
                ontimeout: function () {
                    completedRequests++;
                    console.log(`❌ ${source} 请求超时`);
                    checkCompletion();
                }
            });
        });

        // 检查所有请求是否完成
        function checkCompletion() {
            if (completedRequests === sources.length) {
                if (allWords.length >= 10) {
                    // 打乱顺序并取前30条
                    const shuffledWords = allWords.sort(() => Math.random() - 0.5).slice(0, 30);
                    console.log(`✅ 成功组合热搜词: ${shuffledWords.length} 条，来自 ${successfulRequests} 个数据源`);
                    console.log("组合词汇示例:", shuffledWords.slice(0, 5));
                    resolve(shuffledWords);
                } else {
                    console.log(`❌ 热搜词数量不足: ${allWords.length} 条，使用默认搜索词`);
                    resolve(default_search_words);
                }
            }
        }

        // 设置总体超时，防止卡死
        setTimeout(() => {
            if (completedRequests < sources.length) {
                console.log("⏰ 部分请求超时，使用已获取的词汇");
                if (allWords.length >= 10) {
                    const shuffledWords = allWords.sort(() => Math.random() - 0.5).slice(0, 30);
                    console.log(`✅ 使用部分热搜词: ${shuffledWords.length} 条`);
                    resolve(shuffledWords);
                } else {
                    console.log("❌ 超时且词汇不足，使用默认搜索词");
                    resolve(default_search_words);
                }
            }
        }, 15000); // 15秒总超时
    });
}




// 调用getHotSearchWords函数，获取热搜词列表
getHotSearchWords()
    .then(words => {
        search_words = words;
        console.log("搜索词库已加载，共", words.length, "条");
        // 页面加载完成后自动执行
        setTimeout(() => {
            exec();
        }, 1000);
    })
    .catch(error => {
        console.error("获取搜索词失败:", error);
        search_words = default_search_words;
        // 页面加载完成后自动执行
        setTimeout(() => {
            exec();
        }, 1000);
    });

// 定义菜单命令：开始（快速模式）
let menu1 = GM_registerMenuCommand('🚀 快速开始（无暂停）', function () {
    startSearchTask(false);
}, 'o');

// 定义菜单命令：开始（安全模式）
let menu1_safe = GM_registerMenuCommand('🛡️ 安全开始（带暂停）', function () {
    startSearchTask(true);
}, 'o');

// 统一的开始搜索任务函数
function startSearchTask(enablePause) {
    const todayCount = getTodayCount();
    const remainingCount = max_rewards - todayCount;

    if (remainingCount <= 0) {
        showNotification('今日搜索任务已完成！已执行 ' + todayCount + ' 次搜索。', 'success');
        console.log('今日搜索任务已完成！已执行 ' + todayCount + ' 次搜索。');
        return;
    }

    // 设置暂停模式
    enable_pause = enablePause;
    const modeText = enablePause ? '安全模式（每5次暂停4分钟）' : '快速模式（无暂停）';

    showNotification('开始执行搜索任务 - ' + modeText + '\n今日已执行：' + todayCount + ' 次，剩余：' + remainingCount + ' 次', 'info');
    console.log('开始搜索任务 -', modeText, '今日已执行：' + todayCount + ' 次，剩余：' + remainingCount + ' 次');
    GM_setValue('Cnt', todayCount); // 从今日已执行次数开始

    // 立即执行第一次搜索，不等待延迟
    executeImmediateSearch();
}

// 定义菜单命令：停止
let menu2 = GM_registerMenuCommand('⏹️ 停止任务', function () {
    GM_setValue('Cnt', max_rewards + 10); // 将计数器设置为超过最大搜索次数，以停止搜索
    enable_pause = false; // 重置暂停模式
    showNotification('搜索任务已停止', 'warning');
    console.log('搜索任务已停止');
}, 'o');

// 定义菜单命令：查看今日进度
let menu3 = GM_registerMenuCommand('📊 查看今日进度', function () {
    const todayCount = getTodayCount();
    const remainingCount = max_rewards - todayCount;
    const progressPercent = Math.round((todayCount / max_rewards) * 100);
    const modeText = enable_pause ? '安全模式（带暂停）' : '快速模式（无暂停）';
    showNotification('今日进度：已完成 ' + todayCount + ' / ' + max_rewards + ' 次搜索 (' + progressPercent + '%)\n剩余：' + remainingCount + ' 次\n当前模式：' + modeText, 'info');
    console.log('今日进度：已完成 ' + todayCount + ' / ' + max_rewards + ' 次搜索，剩余：' + remainingCount + ' 次，模式：' + modeText);
}, 'o');


// 定义菜单命令：刷新搜索词库
let menu5 = GM_registerMenuCommand('🔄 刷新词库', function () {
    showNotification('正在从多个数据源刷新搜索词库...', 'info');
    console.log('=== 手动刷新搜索词库 ===');

    getHotSearchWords()
        .then(words => {
            search_words = words;
            const isHotWords = !words.includes("人工智能发展趋势");
            const wordType = isHotWords ? '热门搜索词' : '默认搜索词';
            showNotification(`搜索词库已更新：${wordType}\n共 ${words.length} 条词汇\n示例：${words.slice(0, 3).join('、')}`, 'success');
            console.log("✅ 搜索词库已更新，共", words.length, "条，类型:", wordType);
            console.log("前10个词汇:", words.slice(0, 10));
        })
        .catch(error => {
            console.error("❌ 刷新搜索词库失败:", error);
            showNotification('刷新搜索词库失败，使用默认词库', 'error');
        });
}, 'o');

// 定义菜单命令：显示所有搜索词
let menu6 = GM_registerMenuCommand('📝 查看所有搜索词', function () {
    if (search_words.length === 0) {
        showNotification('搜索词库为空，请先刷新词库', 'warning');
        return;
    }

    const isHotWords = !search_words.includes("人工智能发展趋势");
    const wordType = isHotWords ? '热门搜索词' : '默认搜索词';

    showSearchWordsModal(search_words, wordType);
}, 'o');

// 定义菜单命令：清除今日进度
let menu7 = GM_registerMenuCommand('🗑️ 清除今日进度', function () {
    clearTodayProgress();
}, 'o');


// 显示搜索词弹窗的函数
function showSearchWordsModal(words, wordType) {
    // 移除已存在的弹窗
    const existingModal = document.getElementById('search-words-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.id = 'search-words-modal';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 10001;
        display: flex;
        justify-content: center;
        align-items: center;
        animation: fadeIn 0.3s ease-out;
    `;

    // 创建弹窗内容
    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        max-width: 80%;
        max-height: 80%;
        overflow: hidden;
        animation: slideIn 0.3s ease-out;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // 创建标题栏
    const header = document.createElement('div');
    header.style.cssText = `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px;
        font-size: 18px;
        font-weight: bold;
        display: flex;
        justify-content: space-between;
        align-items: center;
    `;
    header.innerHTML = `
        <span>📝 当前搜索词库 (${wordType} - 共${words.length}条)</span>
        <span style="cursor: pointer; font-size: 24px; opacity: 0.8; hover: opacity: 1;" onclick="this.closest('#search-words-modal').remove()">×</span>
    `;

    // 创建内容区域
    const content = document.createElement('div');
    content.style.cssText = `
        padding: 20px;
        max-height: 400px;
        overflow-y: auto;
        line-height: 1.6;
    `;

    // 创建搜索词列表
    const wordsList = document.createElement('div');
    wordsList.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 10px;
        margin-top: 10px;
    `;

    words.forEach((word, index) => {
        const wordItem = document.createElement('div');
        wordItem.style.cssText = `
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 6px;
            padding: 8px 12px;
            font-size: 14px;
            color: #495057;
            transition: all 0.2s ease;
            cursor: pointer;
        `;
        wordItem.innerHTML = `<strong>${index + 1}.</strong> ${word}`;

        // 添加悬停效果
        wordItem.onmouseover = () => {
            wordItem.style.background = '#e3f2fd';
            wordItem.style.borderColor = '#2196f3';
            wordItem.style.transform = 'translateY(-1px)';
        };
        wordItem.onmouseout = () => {
            wordItem.style.background = '#f8f9fa';
            wordItem.style.borderColor = '#e9ecef';
            wordItem.style.transform = 'translateY(0)';
        };

        wordsList.appendChild(wordItem);
    });

    // 创建底部按钮区域
    const footer = document.createElement('div');
    footer.style.cssText = `
        padding: 15px 20px;
        background: #f8f9fa;
        border-top: 1px solid #e9ecef;
        display: flex;
        justify-content: space-between;
        align-items: center;
    `;

    const copyBtn = document.createElement('button');
    copyBtn.innerHTML = '📋 复制所有词汇';
    copyBtn.style.cssText = `
        background: #28a745;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        transition: background 0.2s ease;
    `;
    copyBtn.onmouseover = () => copyBtn.style.background = '#218838';
    copyBtn.onmouseout = () => copyBtn.style.background = '#28a745';
    copyBtn.onclick = () => {
        navigator.clipboard.writeText(words.join('\n')).then(() => {
            showNotification('搜索词已复制到剪贴板', 'success');
        }).catch(() => {
            // 降级方案
            const textArea = document.createElement('textarea');
            textArea.value = words.join('\n');
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showNotification('搜索词已复制到剪贴板', 'success');
        });
    };

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '关闭';
    closeBtn.style.cssText = `
        background: #6c757d;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        transition: background 0.2s ease;
    `;
    closeBtn.onmouseover = () => closeBtn.style.background = '#5a6268';
    closeBtn.onmouseout = () => closeBtn.style.background = '#6c757d';
    closeBtn.onclick = () => overlay.remove();

    footer.appendChild(copyBtn);
    footer.appendChild(closeBtn);

    // 组装弹窗
    content.appendChild(wordsList);
    modal.appendChild(header);
    modal.appendChild(content);
    modal.appendChild(footer);
    overlay.appendChild(modal);

    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slideIn {
            from { transform: scale(0.9) translateY(-20px); opacity: 0; }
            to { transform: scale(1) translateY(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);

    // 点击遮罩层关闭弹窗
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    };

    // 添加到页面
    document.body.appendChild(overlay);
}

// 创建页面内通知的函数
function showNotification(message, type = 'info') {
    // 移除已存在的通知
    const existingNotification = document.getElementById('rewards-notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // 创建通知元素
    const notification = document.createElement('div');
    notification.id = 'rewards-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        max-width: 350px;
        padding: 15px 20px;
        border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        line-height: 1.4;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        white-space: pre-line;
    `;

    // 根据类型设置颜色
    const colors = {
        'info': { bg: '#e3f2fd', border: '#2196f3', text: '#1565c0' },
        'success': { bg: '#e8f5e8', border: '#4caf50', text: '#2e7d32' },
        'warning': { bg: '#fff3e0', border: '#ff9800', text: '#f57c00' },
        'error': { bg: '#ffebee', border: '#f44336', text: '#c62828' }
    };

    const color = colors[type] || colors.info;
    notification.style.backgroundColor = color.bg;
    notification.style.border = `2px solid ${color.border}`;
    notification.style.color = color.text;

    notification.textContent = message;

    // 添加关闭按钮
    const closeBtn = document.createElement('span');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
        position: absolute;
        top: 8px;
        right: 12px;
        cursor: pointer;
        font-size: 18px;
        font-weight: bold;
        opacity: 0.7;
    `;
    closeBtn.onclick = () => notification.remove();
    notification.appendChild(closeBtn);

    // 添加动画样式
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);

    // 添加到页面
    document.body.appendChild(notification);

    // 5秒后自动消失
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// 立即执行搜索的函数
function executeImmediateSearch() {
    const currentCount = getTodayCount();
    if (currentCount >= max_rewards) {
        showNotification('今日搜索任务已完成！', 'success');
        console.log('今日搜索任务已完成！');
        return;
    }

    let randomString = generateRandomString(4);
    let randomCvid = generateRandomString(32);
    let baseWord = search_words[currentCount % search_words.length];
    let searchWord = generateSearchWord(baseWord, currentCount + 1);

    // 更新今日计数
    saveTodayCount(currentCount + 1);
    GM_setValue('Cnt', currentCount + 1);

    showNotification('立即执行第 ' + (currentCount + 1) + ' 次搜索：' + searchWord, 'info');
    console.log('立即执行第 ' + (currentCount + 1) + ' 次搜索：' + searchWord);

    // 立即跳转搜索
    if (currentCount < max_rewards / 2) {
        location.href = "https://www.bing.com/search?q=" + encodeURI(searchWord) + "&form=" + randomString + "&cvid=" + randomCvid;
    } else {
        location.href = "https://cn.bing.com/search?q=" + encodeURI(searchWord) + "&form=" + randomString + "&cvid=" + randomCvid;
    }
}


// 生成指定长度的包含大写字母、数字的随机字符串
function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        // 从字符集中随机选择字符，并拼接到结果字符串中
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function exec() {
    console.log("=== exec() 函数开始执行 ===");
    console.log("当前页面URL:", window.location.href);

    // 生成随机延迟时间 - 固定45秒间隔
    let randomDelay = 45000; // 固定45秒间隔
    let randomString = generateRandomString(4); //生成4个长度的随机字符串
    let randomCvid = generateRandomString(32); //生成32位长度的cvid
    'use strict';

    // 检查是否在首页等待状态，如果是则直接开始搜索
    if (window.location.href.includes('br_msg=Please-Wait')) {
        console.log("检测到首页等待状态，直接开始搜索...");
        const todayCount = getTodayCount();
        GM_setValue('Cnt', todayCount);
        setTimeout(function () {
            let baseWord = search_words[todayCount % search_words.length];
            let searchWord = generateSearchWord(baseWord, todayCount + 1);
            location.href = "https://www.bing.com/search?q=" + encodeURI(searchWord) + "&form=" + randomString + "&cvid=" + randomCvid;
        }, 3000); // 3秒后开始搜索
        return;
    }

    // 检查计数器的值，若为空则设置为今日已执行次数
    if (GM_getValue('Cnt') == null) {
        const todayCount = getTodayCount();
        GM_setValue('Cnt', todayCount);
    }

    // 获取当前搜索次数
    let currentSearchCount = GM_getValue('Cnt');
    const todayCount = getTodayCount();

    // 检查今日是否已完成所有搜索
    if (todayCount >= max_rewards) {
        console.log("今日搜索任务已完成！已执行 " + todayCount + " 次搜索。");
        showNotification('今日搜索任务已完成！已执行 ' + todayCount + ' 次搜索。', 'success');
        return;
    }

    console.log("当前搜索计数器:", currentSearchCount);
    console.log("今日已执行次数:", todayCount);
    console.log("剩余搜索次数:", max_rewards - todayCount);

    // 同步计数器与今日实际执行次数
    if (currentSearchCount < todayCount) {
        currentSearchCount = todayCount;
        GM_setValue('Cnt', currentSearchCount);
    }

    // 根据计数器的值选择搜索引擎
    if (currentSearchCount < max_rewards) {
        // 先更新计数器和今日执行次数
        GM_setValue('Cnt', currentSearchCount + 1);
        saveTodayCount(todayCount + 1);

        // 然后更新标题（使用更新后的值）
        const updatedTodayCount = todayCount + 1;
        let tt = document.getElementsByTagName("title")[0];
        const remainingCount = max_rewards - updatedTodayCount;
        tt.innerHTML = "[今日: " + updatedTodayCount + "/" + max_rewards + " | 剩余: " + remainingCount + "] " + tt.innerHTML; // 在标题中显示今日进度
        smoothScrollToBottom(); // 添加执行滚动页面到底部的操作

        setTimeout(function () {
            let baseWord = search_words[currentSearchCount % search_words.length]; // 获取当前搜索词，使用取模避免数组越界
            let searchWord = generateSearchWord(baseWord, todayCount + 1); // 生成带次数后缀的搜索词

            // 检查是否需要暂停 - 每5次暂停4分钟（仅在启用暂停模式时）
            if (enable_pause && (todayCount + 1) % 5 === 0 && todayCount > 0) {
                console.log("今日已执行" + (todayCount + 1) + "次搜索，安全模式暂停4分钟...");
                showNotification('安全模式：已完成5次搜索，暂停4分钟防止检测...', 'warning');
                setTimeout(function () {
                    executeSearch(currentSearchCount, searchWord, randomString, randomCvid);
                }, pause_time);
            } else {
                executeSearch(currentSearchCount, searchWord, randomString, randomCvid);
            }
        }, randomDelay);
    }

    // 执行搜索的函数
    function executeSearch(searchCount, searchWord, formString, cvid) {
        if (searchCount < max_rewards / 2) {
            location.href = "https://www.bing.com/search?q=" + encodeURI(searchWord) + "&form=" + formString + "&cvid=" + cvid;
        } else {
            location.href = "https://cn.bing.com/search?q=" + encodeURI(searchWord) + "&form=" + formString + "&cvid=" + cvid;
        }
    }

    // 实现平滑滚动到页面底部的函数
    function smoothScrollToBottom() {
        const startPosition = window.pageYOffset;
        const targetPosition = document.body.scrollHeight - window.innerHeight;
        const distance = targetPosition - startPosition;
        const duration = 3000; // 3秒钟滚动时间
        let startTime = null;

        function animation(currentTime) {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);

            // 使用缓动函数，让滚动更自然
            const easeInOutQuad = progress < 0.5
                ? 2 * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;

            const currentPosition = startPosition + (distance * easeInOutQuad);
            window.scrollTo(0, currentPosition);

            if (progress < 1) {
                requestAnimationFrame(animation);
            }
        }

        // 只有当页面有足够内容需要滚动时才执行
        if (distance > 100) {
            requestAnimationFrame(animation);
        }
    }
}

// 清除今日进度并跳转到首页
function clearTodayProgress() {
    const todayKey = getTodayKey();
    const savedData = GM_getValue('dailyProgress', '{}');
    const progressData = JSON.parse(savedData);

    // 删除今日进度
    if (progressData[todayKey]) {
        delete progressData[todayKey];
        GM_setValue('dailyProgress', JSON.stringify(progressData));

        // 重置计数器
        GM_setValue('Cnt', 0);

        // 显示通知
        showNotification('今日进度已清除，即将跳转到首页', 'success');
        console.log('今日进度已清除');

        // 延迟1秒后跳转到首页
        setTimeout(() => {
            window.location.href = 'https://www.bing.com/';
        }, 1000);
    } else {
        showNotification('今日尚未执行搜索任务', 'info');
        console.log('今日尚未执行搜索任务');
    }
}