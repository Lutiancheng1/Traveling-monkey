// ==UserScript==
// @name         微软Rewards自动搜索脚本 - PC版
// @version      1.0.0
// @description  微软Rewards自动搜索获取积分 - PC桌面版本：适用于Edge浏览器，支持热门搜索词获取
// @author       个人维护版本
// @match        https://*.bing.com/*
// @exclude      https://rewards.bing.com/*
// @license      MIT
// @icon         https://www.bing.com/favicon.ico
// @connect      gumengya.com
// @run-at       document-end
// @note         PC桌面版本 - 2025年8月14日更新
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @grant        GM_openInTab
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @namespace    personal-rewards-script-pc
// ==/UserScript==

/*
 * 微软Rewards自动搜索脚本 - PC版
 * 
 * 主要特点：
 * - 适用于PC桌面浏览器（Edge、Chrome等）
 * - 搜索次数：40次（PC版积分要求更高）
 * - 随机延迟：10-30秒，模拟真实用户行为
 * - 字符串混淆：避免搜索词被检测
 * - 热门搜索词：自动获取微博、头条、抖音、百度热搜
 * 
 * 使用说明：
 * 1. 在Edge浏览器的Tampermonkey插件中安装此脚本
 * 2. 打开Bing搜索页面
 * 3. 点击油猴菜单中的"开始"按钮
 * 4. 脚本会自动执行搜索任务
 * 
 * 注意事项：
 * - PC版需要更多搜索次数才能获得满分
 * - 建议在非高峰时段使用
 * - 如遇异常请手动停止脚本
 */

var max_rewards = 40; //PC版搜索次数（比移动版多10次）
//每执行5次搜索后插入暂停时间,解决账号被监控不增加积分的问题
var pause_time = 300000; // 暂停时长5分钟 (300000毫秒=5分钟)
var search_words = []; //搜索词
var appkey = "";//从https://www.gmya.net/api 网站申请的热门词接口APIKEY
var Hot_words_apis = "https://api.gmya.net/Api/";// 故梦热门词API接口网站


//默认搜索词，热门搜索词请求失败时使用
var default_search_words = ["盛年不重来，一日难再晨", "千里之行，始于足下", "少年易学老难成，一寸光阴不可轻", "敏而好学，不耻下问", "海内存知已，天涯若比邻", "三人行，必有我师焉",
  "莫愁前路无知已，天下谁人不识君", "人生贵相知，何用金与钱", "天生我材必有用", "海纳百川有容乃大；壁立千仞无欲则刚", "穷则独善其身，达则兼济天下", "读书破万卷，下笔如有神",
  "学而不思则罔，思而不学则殆", "一年之计在于春，一日之计在于晨", "莫等闲，白了少年头，空悲切", "少壮不努力，老大徒伤悲", "一寸光阴一寸金，寸金难买寸光阴", "近朱者赤，近墨者黑",
  "吾生也有涯，而知也无涯", "纸上得来终觉浅，绝知此事要躬行", "学无止境", "己所不欲，勿施于人", "天将降大任于斯人也", "鞠躬尽瘁，死而后已", "书到用时方恨少", "天下兴亡，匹夫有责",
  "人无远虑，必有近忧", "为中华之崛起而读书", "一日无书，百事荒废", "岂能尽如人意，但求无愧我心", "人生自古谁无死，留取丹心照汗青", "吾生也有涯，而知也无涯", "生于忧患，死于安乐",
  "言必信，行必果", "读书破万卷，下笔如有神", "夫君子之行，静以修身，俭以养德", "老骥伏枥，志在千里", "一日不读书，胸臆无佳想", "王侯将相宁有种乎", "淡泊以明志。宁静而致远,", "卧龙跃马终黄土"]
//{weibohot}微博热搜榜//{douyinhot}抖音热搜榜/{zhihuhot}知乎热搜榜/{baiduhot}百度热搜榜/{toutiaohot}今日头条热搜榜/
var keywords_source = ['WeiBoHot', 'TouTiaoHot', 'DouYinHot', 'BaiduHot'];
var random_keywords_source = keywords_source[Math.floor(Math.random() * keywords_source.length)];
var current_source_index = 0; // 当前搜索词来源的索引

/**
 * 尝试从多个搜索词来源获取搜索词，如果所有来源都失败，则返回默认搜索词。
 * @returns {Promise<string[]>} 返回搜索到的name属性值列表或默认搜索词列表
 */
async function douyinhot_dic() {
  while (current_source_index < keywords_source.length) {
    const source = keywords_source[current_source_index]; // 获取当前搜索词来源
    let url;
    //根据 appkey 是否为空来决定如何构建 URL地址,如果appkey为空,则直接请求接口地址
    if (appkey) {
      url = Hot_words_apis + source + "?format=json&appkey=" + appkey;//有appkey则添加appkey参数
    } else {
      url = Hot_words_apis + source;//无appkey则直接请求接口地址
    }
    try {
      const response = await fetch(url); // 发起网络请求
      if (!response.ok) {
        throw new Error('HTTP error! status: ' + response.status); // 如果响应状态不是OK，则抛出错误
      }
      const data = await response.json(); // 解析响应内容为JSON

      if (data.data.some(item => item)) {
        // 如果数据中存在有效项
        // 提取每个元素的title属性值
        const names = data.data.map(item => item.title);
        return names; // 返回搜索到的title属性值列表
      }
    } catch (error) {
      // 当前来源请求失败，记录错误并尝试下一个来源
      console.error('搜索词来源请求失败:', error);
    }

    // 尝试下一个搜索词来源
    current_source_index++;
  }

  // 所有搜索词来源都已尝试且失败
  console.error('所有搜索词来源请求失败');
  return default_search_words; // 返回默认搜索词列表
}

// 执行搜索
douyinhot_dic()
  .then(names => {
    //   console.log(names[0]);
    search_words = names;
    exec()
  })
  .catch(error => {
    console.error(error);
  });

// 定义菜单命令：开始搜索
let menu1 = GM_registerMenuCommand('🚀 开始搜索', function () {
  GM_setValue('Cnt', 0); // 将计数器重置为0
  console.log('开始PC版搜索任务，总共需要执行', max_rewards, '次搜索');
  location.href = "https://www.bing.com/"; // 跳转到Bing首页，去掉br_msg参数避免卡住
}, 'o');

// 定义菜单命令：停止搜索
let menu2 = GM_registerMenuCommand('⏹️ 停止搜索', function () {
  GM_setValue('Cnt', max_rewards + 10); // 将计数器设置为超过最大搜索次数，以停止搜索
  console.log('PC版搜索任务已停止');
}, 'o');

// 定义菜单命令：查看进度
let menu3 = GM_registerMenuCommand('📊 查看进度', function () {
  const currentCount = GM_getValue('Cnt') || 0;
  const remaining = Math.max(0, max_rewards - currentCount);
  const progress = Math.round((currentCount / max_rewards) * 100);
  alert(`PC版搜索进度：\n已完成：${currentCount} / ${max_rewards} 次 (${progress}%)\n剩余：${remaining} 次`);
}, 'o');

// 自动将字符串中的字符进行替换
function AutoStrTrans(st) {
  let yStr = st; // 原字符串
  let rStr = ""; // 插入的混淆字符，可以自定义自己的混淆字符串
  let zStr = ""; // 结果字符串
  let prePo = 0;
  for (let i = 0; i < yStr.length;) {
    let step = Math.floor(Math.random() * 5) + 1; // 随机生成步长
    if (i > 0) {
      zStr = zStr + yStr.substr(prePo, i - prePo) + rStr; // 将插入字符插入到相应位置
      prePo = i;
    }
    i = i + step;
  }
  if (prePo < yStr.length) {
    zStr = zStr + yStr.substr(prePo, yStr.length - prePo); // 将剩余部分添加到结果字符串中
  }
  return zStr;
}

// 生成指定长度的包含大写字母、小写字母和数字的随机字符串
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
  // 生成随机延迟时间
  let randomDelay = Math.floor(Math.random() * 20000) + 10000; // 生成10秒到30秒之间的随机数
  let randomString = generateRandomString(4); //生成4个长度的随机字符串
  let randomCvid = generateRandomString(32); //生成32位长度的cvid
  'use strict';

  // 检查计数器的值，若为空则设置为超过最大搜索次数
  if (GM_getValue('Cnt') == null) {
    GM_setValue('Cnt', max_rewards + 10);
  }

  // 获取当前搜索次数
  let currentSearchCount = GM_getValue('Cnt');
  // 根据计数器的值选择搜索引擎
  if (currentSearchCount <= max_rewards / 2) {
    let tt = document.getElementsByTagName("title")[0];
    tt.innerHTML = "[" + currentSearchCount + " / " + max_rewards + "] " + tt.innerHTML; // 在标题中显示当前搜索次数
    smoothScrollToBottom(); // 添加执行滚动页面到底部的操作
    GM_setValue('Cnt', currentSearchCount + 1); // 将计数器加1
    setTimeout(function () {
      let nowtxt = search_words[currentSearchCount]; // 获取当前搜索词
      nowtxt = AutoStrTrans(nowtxt); // 对搜索词进行替换
      // 检查是否需要暂停 - 每5次暂停5分钟
      if ((currentSearchCount + 1) % 5 === 0) {
        console.log("已执行" + (currentSearchCount + 1) + "次搜索，暂停5分钟防止检测...");
        setTimeout(function () {
          location.href = "https://www.bing.com/search?q=" + encodeURI(nowtxt) + "&form=" + randomString + "&cvid=" + randomCvid; // 在Bing搜索引擎中搜索
        }, pause_time);
      } else {
        location.href = "https://www.bing.com/search?q=" + encodeURI(nowtxt) + "&form=" + randomString + "&cvid=" + randomCvid; // 在Bing搜索引擎中搜索
      }
    }, randomDelay);
  } else if (currentSearchCount > max_rewards / 2 && currentSearchCount < max_rewards) {
    let tt = document.getElementsByTagName("title")[0];
    tt.innerHTML = "[" + currentSearchCount + " / " + max_rewards + "] " + tt.innerHTML; // 在标题中显示当前搜索次数
    smoothScrollToBottom(); // 添加执行滚动页面到底部的操作
    GM_setValue('Cnt', currentSearchCount + 1); // 将计数器加1

    setTimeout(function () {
      let nowtxt = search_words[currentSearchCount]; // 获取当前搜索词
      nowtxt = AutoStrTrans(nowtxt); // 对搜索词进行替换
      // 检查是否需要暂停 - 每5次暂停5分钟
      if ((currentSearchCount + 1) % 5 === 0) {
        console.log("已执行" + (currentSearchCount + 1) + "次搜索，暂停5分钟防止检测...");
        setTimeout(function () {
          location.href = "https://cn.bing.com/search?q=" + encodeURI(nowtxt) + "&form=" + randomString + "&cvid=" + randomCvid; // 在Bing搜索引擎中搜索
        }, pause_time);
      } else {
        location.href = "https://cn.bing.com/search?q=" + encodeURI(nowtxt) + "&form=" + randomString + "&cvid=" + randomCvid; // 在Bing搜索引擎中搜索
      }
    }, randomDelay);
  }
  // 实现平滑滚动到页面底部的函数 - PC版优化
  function smoothScrollToBottom() {
    const startPosition = window.pageYOffset;
    const targetPosition = document.body.scrollHeight - window.innerHeight;
    const distance = targetPosition - startPosition;
    const duration = 4000; // PC版4秒钟滚动时间
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