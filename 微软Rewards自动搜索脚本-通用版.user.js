// ==UserScript==
// @name         微软Rewards自动搜索脚本 - 通用版
// @version      2.5.1
// @description  微软Rewards自动搜索获取积分 - 通用版本：自动检测PC/移动环境，智能适配功能
// @author       lutiancheng1
// @match        https://*.bing.com/*
// @exclude      https://rewards.bing.com/*
// @license      MIT
// @icon         https://www.bing.com/favicon.ico
// @connect      gumengya.com
// @run-at       document-end
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @grant        GM_openInTab
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @namespace    personal-rewards-script-universal
// @downloadURL https://update.greasyfork.org/scripts/545879/%E5%BE%AE%E8%BD%AFRewards%E8%87%AA%E5%8A%A8%E6%90%9C%E7%B4%A2%E8%84%9A%E6%9C%AC%20-%20%E9%80%9A%E7%94%A8%E7%89%88.user.js
// @updateURL https://update.greasyfork.org/scripts/545879/%E5%BE%AE%E8%BD%AFRewards%E8%87%AA%E5%8A%A8%E6%90%9C%E7%B4%A2%E8%84%9A%E6%9C%AC%20-%20%E9%80%9A%E7%94%A8%E7%89%88.meta.js
// ==/UserScript==

/*
 * 微软Rewards自动搜索脚本 - 通用版
 * 
 * 环境自动检测：
 * - PC环境：Edge/Chrome + Tampermonkey
 * - 移动环境：Safari + Stay插件
 * 
 * 智能适配功能：
 * - PC版：40次搜索，字符串混淆，随机延迟10-30秒
 * - 移动版：30次搜索，每日缓存，固定45秒间隔
 * - 通用：热门搜索词获取，暂停机制，进度显示
 * 
 * 使用说明：
 * 1. 安装到对应的用户脚本管理器
 * 2. 打开Bing搜索页面
 * 3. 脚本会自动检测环境并显示对应的菜单选项
 * 4. 点击开始按钮执行搜索任务
 * 
 * 注意事项：
 * - 脚本会根据环境自动调整参数
 * - 建议在非高峰时段使用
 * - 如遇异常请手动停止脚本
 */

// 环境检测
const isMobile = /iPhone|iPad|iPod|Android|Mobile/i.test(navigator.userAgent) ||
  (navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome'));
const isStay = navigator.userAgent.includes('Stay') || window.location.href.includes('stay');
const isPCEnvironment = !isMobile && !isStay;

console.log('环境检测结果:', {
  isMobile: isMobile,
  isStay: isStay,
  isPCEnvironment: isPCEnvironment,
  userAgent: navigator.userAgent
});

// 根据环境设置参数
const config = {
  maxRewards: isPCEnvironment ? 40 : 30,
  pauseTime: isPCEnvironment ? 300000 : 240000, // PC版5分钟，移动版4分钟
  searchDelay: isPCEnvironment ?
    () => Math.floor(Math.random() * 20000) + 10000 : // PC版10-30秒随机
    () => 45000, // 移动版固定45秒
  enableStringObfuscation: isPCEnvironment, // 只有PC版启用字符串混淆
  enableDailyCache: !isPCEnvironment, // 只有移动版启用每日缓存
  scrollDuration: isPCEnvironment ? 4000 : 3000, // PC版4秒，移动版3秒
  platformName: isPCEnvironment ? 'PC版' : '移动版'
};

console.log('配置参数:', config);

// 全局变量
var search_words = [];
var appkey = ""; // 用户可通过菜单设置自己的故梦API密钥
var enable_pause = false;

// 热搜API配置
var hotSearchAPI = {
  name: "故梦热门词API",
  url: "https://api.gmya.net/Api/",
  sources: ['BaiduHot', 'WeiBoHot', 'TouTiaoHot', 'DouYinHot'],
  parser: (data) => data.data && data.data.map(item => item.title)
};

// 默认搜索词
var default_search_words = [
  "人工智能发展趋势", "新能源汽车技术", "量子计算突破", "5G网络应用", "区块链技术创新",
  "元宇宙概念解析", "机器学习算法", "云计算服务", "物联网应用", "大数据分析",
  "网络安全防护", "移动支付发展", "电商平台创新", "在线教育模式", "远程办公趋势",
  "智能家居系统", "无人驾驶技术", "虚拟现实体验", "增强现实应用", "生物识别技术",
  "绿色能源发展", "环保科技创新", "可持续发展", "数字化转型", "智慧城市建设",
  "医疗科技进步", "基因编辑技术", "精准医疗", "健康管理系统", "运动科学研究",
  "盛年不重来，一日难再晨", "千里之行，始于足下", "少年易学老难成，一寸光阴不可轻",
  "敏而好学，不耻下问", "海内存知已，天涯若比邻", "三人行，必有我师焉",
  "莫愁前路无知已，天下谁人不识君", "人生贵相知，何用金与钱", "天生我材必有用",
  "海纳百川有容乃大；壁立千仞无欲则刚", "穷则独善其身，达则兼济天下", "读书破万卷，下笔如有神"
];

// 平台区分的存储键名
const platformStorageKeys = {
  dailyProgress: isPCEnvironment ? 'dailyProgress_PC' : 'dailyProgress_Mobile',
  searchCount: isPCEnvironment ? 'Cnt_PC' : 'Cnt_Mobile',
  platformName: config.platformName
};

console.log('存储键配置:', platformStorageKeys);

// 每日缓存相关函数（支持平台区分）
function getTodayKey() {
  if (!config.enableDailyCache) return null;
  const today = new Date();
  const dateKey = today.getFullYear() + '-' + (today.getMonth() + 1).toString().padStart(2, '0') + '-' + today.getDate().toString().padStart(2, '0');
  return `${dateKey}_${config.platformName}`;
}

function getTodayCount() {
  if (!config.enableDailyCache) return 0;
  const todayKey = getTodayKey();
  const savedData = GM_getValue(platformStorageKeys.dailyProgress, '{}');
  const progressData = JSON.parse(savedData);
  return progressData[todayKey] || 0;
}

function saveTodayCount(count) {
  if (!config.enableDailyCache) return;
  const todayKey = getTodayKey();
  const savedData = GM_getValue(platformStorageKeys.dailyProgress, '{}');
  const progressData = JSON.parse(savedData);
  progressData[todayKey] = count;

  // 清理7天前的数据
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const cutoffDate = sevenDaysAgo.getFullYear() + '-' + (sevenDaysAgo.getMonth() + 1).toString().padStart(2, '0') + '-' + sevenDaysAgo.getDate().toString().padStart(2, '0');
  const cutoffKey = `${cutoffDate}_${config.platformName}`;

  Object.keys(progressData).forEach(key => {
    if (key < cutoffKey) {
      delete progressData[key];
    }
  });

  GM_setValue(platformStorageKeys.dailyProgress, JSON.stringify(progressData));
  console.log(`${config.platformName}进度已保存:`, todayKey, '=', count);
}

// 获取平台特定的搜索计数
function getPlatformSearchCount() {
  return GM_getValue(platformStorageKeys.searchCount) || 0;
}

// 保存平台特定的搜索计数
function savePlatformSearchCount(count) {
  GM_setValue(platformStorageKeys.searchCount, count);
  console.log(`${config.platformName}搜索计数已保存:`, count);
}

// 获取今日搜索次数（通用函数）
function getTodaySearchCount() {
  if (config.enableDailyCache) {
    return getTodayCount();
  } else {
    return getPlatformSearchCount();
  }
}

// AppKey管理功能
function loadAppKey() {
  const savedKey = GM_getValue('userAppKey', '');
  if (savedKey) {
    appkey = savedKey;
    console.log('已加载用户设置的AppKey');
  }
}

function saveAppKey(key) {
  GM_setValue('userAppKey', key);
  appkey = key;
  console.log('AppKey已保存');
}

function showAppKeyDialog() {
  const currentKey = GM_getValue('userAppKey', '');
  const newKey = prompt(`设置故梦API密钥（可选）：\n\n• 有密钥：获取更稳定的热搜词\n• 无密钥：使用免费额度\n• 申请地址：https://www.gmya.net/api\n\n当前密钥：${currentKey ? '已设置' : '未设置'}`, currentKey);

  if (newKey !== null) {
    if (newKey.trim() === '') {
      GM_setValue('userAppKey', '');
      appkey = '';
      showNotification('AppKey已清空，将使用免费额度', 'info');
    } else {
      saveAppKey(newKey.trim());
      showNotification('AppKey已保存，重新加载词库以生效', 'success');
      // 重新加载搜索词
      getHotSearchWords().then(words => {
        search_words = words;
        const isHotWords = !words.includes("人工智能发展趋势");
        const wordType = isHotWords ? '热门搜索词' : '默认搜索词';
        showNotification(`词库已更新：${wordType}`, 'success');
      });
    }
  }
}

// 清除今日进度的函数
function clearTodayProgress() {
  const currentProgress = getTodaySearchCount();

  if (currentProgress === 0) {
    showNotification(`${config.platformName}今日进度已经是0，无需清除`, 'info');
    return;
  }

  const confirmMessage = `确定要清除${config.platformName}今日进度吗？\n\n当前进度：${currentProgress} / ${config.maxRewards} 次\n\n清除后将重新开始计数。`;

  if (confirm(confirmMessage)) {
    // 清除平台特定的搜索计数
    savePlatformSearchCount(0);

    // 如果是移动版，还需要清除每日缓存
    if (config.enableDailyCache) {
      const todayKey = getTodayKey();
      const savedData = GM_getValue(platformStorageKeys.dailyProgress, '{}');
      const progressData = JSON.parse(savedData);

      if (progressData[todayKey]) {
        delete progressData[todayKey];
        GM_setValue(platformStorageKeys.dailyProgress, JSON.stringify(progressData));
      }
    }

    showNotification(`${config.platformName}今日进度已清除，重新开始计数`, 'success');
    console.log(`${config.platformName}今日进度已清除`);

    // 刷新页面标题（如果存在的话）
    const titleElement = document.getElementsByTagName("title")[0];
    if (titleElement && titleElement.innerHTML.includes(config.platformName)) {
      location.reload();
    }
  }
}

// 初始化时加载用户的AppKey
loadAppKey();

// 字符串混淆函数（仅PC版使用）
function AutoStrTrans(st) {
  if (!config.enableStringObfuscation) return st;

  let yStr = st;
  let rStr = "";
  let zStr = "";
  let prePo = 0;
  for (let i = 0; i < yStr.length;) {
    let step = Math.floor(Math.random() * 5) + 1;
    if (i > 0) {
      zStr = zStr + yStr.substr(prePo, i - prePo) + rStr;
      prePo = i;
    }
    i = i + step;
  }
  if (prePo < yStr.length) {
    zStr = zStr + yStr.substr(prePo, yStr.length - prePo);
  }
  return zStr;
}

// 生成带次数后缀的搜索词（移动版功能）
function generateSearchWord(baseWord, searchCount) {
  if (config.enableStringObfuscation) {
    // PC版使用字符串混淆
    return AutoStrTrans(baseWord);
  } else {
    // 移动版使用次数后缀
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
}

// 生成随机字符串
function generateRandomString(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

// 获取热门搜索词的函数
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
          const shuffledWords = allWords.sort(() => Math.random() - 0.5).slice(0, config.maxRewards);
          console.log(`✅ 成功组合热搜词: ${shuffledWords.length} 条，来自 ${successfulRequests} 个数据源`);
          resolve(shuffledWords);
        } else {
          console.log(`❌ 热搜词数量不足: ${allWords.length} 条，使用默认搜索词`);
          resolve(default_search_words.slice(0, config.maxRewards));
        }
      }
    }

    // 设置总体超时
    setTimeout(() => {
      if (completedRequests < sources.length) {
        console.log("⏰ 部分请求超时，使用已获取的词汇");
        if (allWords.length >= 10) {
          const shuffledWords = allWords.sort(() => Math.random() - 0.5).slice(0, config.maxRewards);
          resolve(shuffledWords);
        } else {
          resolve(default_search_words.slice(0, config.maxRewards));
        }
      }
    }, 15000);
  });
}

// 初始化搜索词
getHotSearchWords()
  .then(words => {
    search_words = words;
    console.log(`${config.platformName}搜索词库已加载，共`, words.length, "条");
    setTimeout(() => {
      exec();
    }, 1000);
  })
  .catch(error => {
    console.error("获取搜索词失败:", error);
    search_words = default_search_words.slice(0, config.maxRewards);
    setTimeout(() => {
      exec();
    }, 1000);
  });

// 根据环境创建不同的菜单
if (isPCEnvironment) {
  // PC版菜单
  let menu1 = GM_registerMenuCommand('�️ PC版开始', 暂 function () {
    startPCSearchTask(true); // PC版默认启用暂停模式
  }, 'o');

  let menu2 = GM_registerMenuCommand('⏹️ 停止搜索', function () {
    savePlatformSearchCount(config.maxRewards + 10);
    console.log(`${config.platformName}搜索任务已停止`);
  }, 'o');

  let menu3 = GM_registerMenuCommand('📊 今日进度', function () {
    const todayCount = getTodaySearchCount();
    const remaining = Math.max(0, config.maxRewards - todayCount);
    const progress = Math.round((todayCount / config.maxRewards) * 100);
    showNotification(`${config.platformName}今日进度：\n已完成：${todayCount} / ${config.maxRewards} 次 (${progress}%)\n剩余：${remaining} 次`, 'info');
  }, 'o');

  let menu4 = GM_registerMenuCommand('🔑 设置API密钥', function () {
    showAppKeyDialog();
  }, 'o');

  let menu5 = GM_registerMenuCommand('🗑️ 清除今日进度', function () {
    clearTodayProgress();
  }, 'o');

} else {
  // 移动版菜单
  let menu1 = GM_registerMenuCommand('📱 快速开始（无暂停）', function () {
    startSearchTask(false);
  }, 'o');

  let menu1_safe = GM_registerMenuCommand('🛡️ 安全开始（带暂停）', function () {
    startSearchTask(true);
  }, 'o');

  let menu2 = GM_registerMenuCommand('⏹️ 停止任务', function () {
    savePlatformSearchCount(config.maxRewards + 10);
    enable_pause = false;
    showNotification('搜索任务已停止', 'warning');
  }, 'o');

  let menu3 = GM_registerMenuCommand('📊 今日进度', function () {
    const todayCount = getTodayCount();
    const remainingCount = config.maxRewards - todayCount;
    const progressPercent = Math.round((todayCount / config.maxRewards) * 100);
    const modeText = enable_pause ? '安全模式（带暂停）' : '快速模式（无暂停）';

    showNotification(`${config.platformName}今日进度：\n已完成：${todayCount} / ${config.maxRewards} 次 (${progressPercent}%)\n剩余：${remainingCount} 次\n运行模式：${modeText}`, 'info');
  }, 'o');

  let menu4 = GM_registerMenuCommand('🔄 刷新词库', function () {
    showNotification('正在从多个数据源刷新搜索词库...', 'info');
    getHotSearchWords()
      .then(words => {
        search_words = words;
        const isHotWords = !words.includes("人工智能发展趋势");
        const wordType = isHotWords ? '热门搜索词' : '默认搜索词';
        showNotification(`搜索词库已更新：${wordType}\n共 ${words.length} 条词汇\n示例：${words.slice(0, 3).join('、')}`, 'success');
      })
      .catch(error => {
        showNotification('刷新搜索词库失败，使用默认词库', 'error');
      });
  }, 'o');

  let menu5 = GM_registerMenuCommand('📝 查看所有搜索词', function () {
    if (search_words.length === 0) {
      showNotification('搜索词库为空，请先刷新词库', 'warning');
      return;
    }

    const isHotWords = !search_words.includes("人工智能发展趋势");
    const wordType = isHotWords ? '热门搜索词' : '默认搜索词';

    showSearchWordsModal(search_words, wordType);
  }, 'o');

  let menu6 = GM_registerMenuCommand('🔑 设置API密钥', function () {
    showAppKeyDialog();
  }, 'o');

  let menu7 = GM_registerMenuCommand('🗑️ 清除今日进度', function () {
    clearTodayProgress();
  }, 'o');


}

// PC版开始搜索任务函数
function startPCSearchTask(enablePause) {
  const currentCount = getPlatformSearchCount();
  const remaining = Math.max(0, config.maxRewards - currentCount);

  if (currentCount >= config.maxRewards) {
    showNotification(`${config.platformName}搜索任务已完成！已执行 ${currentCount} 次搜索。`, 'success');
    return;
  }

  enable_pause = enablePause; // PC版固定启用暂停模式
  const modeText = '安全模式（每5次暂停5分钟）';

  showNotification(`开始执行搜索任务 - ${modeText}\n已完成：${currentCount} / ${config.maxRewards} 次\n剩余：${remaining} 次`, 'info');
  console.log(`开始${config.platformName}搜索任务 - ${modeText}，已完成：${currentCount} 次，剩余：${remaining} 次`);

  savePlatformSearchCount(currentCount);
  location.href = "https://www.bing.com/";
}

// 统一的开始搜索任务函数（移动版）
function startSearchTask(enablePause) {
  const todayCount = getTodayCount();
  const remainingCount = config.maxRewards - todayCount;

  if (remainingCount <= 0) {
    showNotification('今日搜索任务已完成！已执行 ' + todayCount + ' 次搜索。', 'success');
    return;
  }

  enable_pause = enablePause;
  const modeText = enablePause ? '安全模式（每5次暂停4分钟）' : '快速模式（无暂停）';

  showNotification('开始执行搜索任务 - ' + modeText + '\n今日已执行：' + todayCount + ' 次，剩余：' + remainingCount + ' 次', 'info');
  savePlatformSearchCount(todayCount);

  executeImmediateSearch();
}

// 立即执行搜索的函数（移动版）
function executeImmediateSearch() {
  const currentCount = getTodayCount();
  if (currentCount >= config.maxRewards) {
    showNotification('今日搜索任务已完成！', 'success');
    return;
  }

  let randomString = generateRandomString(4);
  let randomCvid = generateRandomString(32);
  let baseWord = search_words[currentCount % search_words.length];
  let searchWord = generateSearchWord(baseWord, currentCount + 1);

  saveTodayCount(currentCount + 1);
  savePlatformSearchCount(currentCount + 1);

  showNotification('立即执行第 ' + (currentCount + 1) + ' 次搜索：' + searchWord, 'info');

  if (currentCount < config.maxRewards / 2) {
    location.href = "https://www.bing.com/search?q=" + encodeURI(searchWord) + "&form=" + randomString + "&cvid=" + randomCvid;
  } else {
    location.href = "https://cn.bing.com/search?q=" + encodeURI(searchWord) + "&form=" + randomString + "&cvid=" + randomCvid;
  }
}

// 显示搜索词弹窗的函数（移动版功能）
function showSearchWordsModal(words, wordType) {
  const existingModal = document.getElementById('search-words-modal');
  if (existingModal) {
    existingModal.remove();
  }

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
        <span id="modal-close-btn" style="cursor: pointer; font-size: 24px; opacity: 0.8; user-select: none;">×</span>
    `;

  // 为关闭按钮添加事件监听器
  const closeButton = header.querySelector('#modal-close-btn');
  closeButton.addEventListener('click', () => {
    overlay.remove();
  });

  const content = document.createElement('div');
  content.style.cssText = `
        padding: 20px;
        max-height: 400px;
        overflow-y: auto;
        line-height: 1.6;
    `;

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

  content.appendChild(wordsList);
  modal.appendChild(header);
  modal.appendChild(content);
  overlay.appendChild(modal);

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

  overlay.onclick = (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  };

  document.body.appendChild(overlay);
}

// 创建页面内通知的函数
function showNotification(message, type = 'info') {
  const existingNotification = document.getElementById('rewards-notification');
  if (existingNotification) {
    existingNotification.remove();
  }

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

  document.body.appendChild(notification);

  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(() => notification.remove(), 300);
    }
  }, 5000);
}

// 主执行函数
function exec() {
  console.log("=== exec() 函数开始执行 ===");
  console.log("当前页面URL:", window.location.href);
  console.log("平台:", config.platformName);

  const randomDelay = config.searchDelay();
  let randomString = generateRandomString(4);
  let randomCvid = generateRandomString(32);

  // 检查是否在首页等待状态
  if (window.location.href.includes('br_msg=Please-Wait')) {
    console.log("检测到首页等待状态，直接开始搜索...");
    const currentCount = config.enableDailyCache ? getTodayCount() : 0;
    savePlatformSearchCount(currentCount);
    setTimeout(function () {
      let baseWord = search_words[currentCount % search_words.length];
      let searchWord = generateSearchWord(baseWord, currentCount + 1);
      location.href = "https://www.bing.com/search?q=" + encodeURI(searchWord) + "&form=" + randomString + "&cvid=" + randomCvid;
    }, 3000);
    return;
  }

  // 检查计数器的值
  if (getPlatformSearchCount() === 0 && !config.enableDailyCache) {
    const currentCount = config.enableDailyCache ? getTodayCount() : 0;
    savePlatformSearchCount(currentCount);
  }

  let currentSearchCount = getPlatformSearchCount();
  const todayCount = config.enableDailyCache ? getTodayCount() : currentSearchCount;

  // 检查是否已完成所有搜索
  if (todayCount >= config.maxRewards) {
    console.log(`${config.platformName}搜索任务已完成！已执行 ${todayCount} 次搜索。`);
    if (!isPCEnvironment) {
      showNotification(`${config.platformName}搜索任务已完成！已执行 ${todayCount} 次搜索。`, 'success');
    }
    return;
  }

  console.log("当前搜索计数器:", currentSearchCount);
  console.log("今日已执行次数:", todayCount);
  console.log("剩余搜索次数:", config.maxRewards - todayCount);

  // 同步计数器
  if (currentSearchCount < todayCount) {
    currentSearchCount = todayCount;
    savePlatformSearchCount(currentSearchCount);
  }

  // 执行搜索
  if (currentSearchCount < config.maxRewards) {
    // 先更新计数器
    savePlatformSearchCount(currentSearchCount + 1);
    if (config.enableDailyCache) {
      saveTodayCount(todayCount + 1);
    }

    // 然后更新标题（使用更新后的值）
    const updatedTodayCount = todayCount + 1;
    let tt = document.getElementsByTagName("title")[0];
    const remainingCount = config.maxRewards - updatedTodayCount;
    tt.innerHTML = `[${config.platformName}: ${updatedTodayCount}/${config.maxRewards} | 剩余: ${remainingCount}] ` + tt.innerHTML;

    smoothScrollToBottom();

    setTimeout(function () {
      let baseWord = search_words[currentSearchCount % search_words.length];
      let searchWord = generateSearchWord(baseWord, todayCount + 1);

      // 检查是否需要暂停
      const shouldPause = config.enableDailyCache ?
        (enable_pause && (todayCount + 1) % 5 === 0 && todayCount > 0) :
        (enable_pause && (currentSearchCount + 1) % 5 === 0);

      if (shouldPause) {
        console.log(`${config.platformName}已执行${todayCount + 1}次搜索，暂停${config.pauseTime / 60000}分钟...`);
        if (!isPCEnvironment) {
          showNotification(`安全模式：已完成5次搜索，暂停${config.pauseTime / 60000}分钟防止检测...`, 'warning');
        }
        setTimeout(function () {
          executeSearch(currentSearchCount, searchWord, randomString, randomCvid);
        }, config.pauseTime);
      } else {
        executeSearch(currentSearchCount, searchWord, randomString, randomCvid);
      }
    }, randomDelay);
  }

  // 执行搜索的函数
  function executeSearch(searchCount, searchWord, formString, cvid) {
    if (searchCount < config.maxRewards / 2) {
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
    const duration = config.scrollDuration;
    let startTime = null;

    function animation(currentTime) {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);

      const easeInOutQuad = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      const currentPosition = startPosition + (distance * easeInOutQuad);
      window.scrollTo(0, currentPosition);

      if (progress < 1) {
        requestAnimationFrame(animation);
      }
    }

    if (distance > 100) {
      requestAnimationFrame(animation);
    }
  }
}