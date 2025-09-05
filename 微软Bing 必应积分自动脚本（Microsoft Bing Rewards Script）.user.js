// ==UserScript==
// @name         微软Bing 必应积分自动脚本（Microsoft Bing Rewards Script）
// @version      1.0.6
// @description  使用Edge搜索，生成高度随机的1500万+搜索词，循环搜索直到达到指定次数。优化UI，包含倒计时。本脚本修改自 yclown 的原始项目。
// @author       BABAlala (原作者 yclown, 修改自其项目 https://github.com/yclown/myTamperMokey)
// @match        https://cn.bing.com/search?*
// @match        https://www.bing.com/search?*
// @icon         https://www.bing.com/favicon.ico
// @require      https://code.jquery.com/jquery-3.1.1.min.js
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @license      GPL-3.0
// @namespace    https://greasyfork.org/users/1413398
// @downloadURL https://update.greasyfork.org/scripts/532315/%E5%BE%AE%E8%BD%AFBing%20%E5%BF%85%E5%BA%94%E7%A7%AF%E5%88%86%E8%87%AA%E5%8A%A8%E8%84%9A%E6%9C%AC%EF%BC%88Microsoft%20Bing%20Rewards%20Script%EF%BC%89.user.js
// @updateURL https://update.greasyfork.org/scripts/532315/%E5%BE%AE%E8%BD%AFBing%20%E5%BF%85%E5%BA%94%E7%A7%AF%E5%88%86%E8%87%AA%E5%8A%A8%E8%84%9A%E6%9C%AC%EF%BC%88Microsoft%20Bing%20Rewards%20Script%EF%BC%89.meta.js
// ==/UserScript==

(function () {
    'use strict';

    // 默认配置
    const DEFAULT_CONFIG = {
        max_pc: 40,
        max_ph: 30,
        min_interval: 50,
        max_interval: 120
    };

    // 添加美化样式和最小化、分割线、拖动样式
    GM_addStyle(`
        #reward_tool {
            position: fixed; right: 30px; bottom: 30px; left:auto; top:auto;
            background: #fff; padding: 0; border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); width: 220px; font-family: sans-serif; z-index: 9999;
            transition: box-shadow 0.2s, opacity 0.2s;
            cursor: default;
            user-select: none;
        }
        #reward_tool .header {
            position: relative;
            height: 36px;
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
            background: #f7f7f7;
            border-bottom: 1px solid #eee;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            padding: 0 8px 0 0;
            cursor: move;
        }
        #reward_tool .divider {
            position: absolute;
            left: 0; right: 36px; top: 35px;
            height: 1px;
            background: #eee;
        }
        #reward_tool .minimize-btn {
            position: absolute; top: 6px; right: 8px; width: 24px; height: 24px; border: none; background: none; cursor: pointer;
            font-size: 20px; color: #0078d4; z-index: 10001; line-height: 24px; padding: 0;
        }
        #reward_tool .minimize-btn:hover {
            color: #e67e22;
        }
        #reward_tool .panel-content {
            padding: 12px 15px 15px 15px;
        }
        #reward_tool a {
            display: block; margin: 5px 0; padding: 5px; color: #fff; background: #0078d4; border-radius: 4px; text-align: center;
        }
        #reward_tool a:hover { background: #005bb5; }
        #reward_tool p { margin: 5px 0; color: #333; font-size: 12px; }
        #reward_tool .count { font-weight: bold; color: #e74c3c; }
        #reward_tool #reward_info { color: #27ae60; }
        #reward_tool #countdown { color: #e67e22; font-weight: bold; }
        #reward_tool.minimized {
            width: 48px !important; height: 48px !important; padding: 0 !important; background: transparent !important; box-shadow: none !important;
            display: flex; align-items: center; justify-content: center;
            right: 30px !important; bottom: 30px !important; left:auto !important; top:auto !important;
        }
        #reward_tool .mini-icon {
            width: 40px; height: 40px; border-radius: 50%; background: #0078d4; display: flex; align-items: center; justify-content: center;
            color: #fff; font-size: 24px; cursor: pointer; margin: auto;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
    `);

    // 初始化界面
    const countInfo = GetConfig();
    document.body.insertAdjacentHTML('beforeend', `
        <div id="reward_tool" style="right:30px; bottom:30px; left:auto; top:auto;">
            <div class="header">
                <button class="minimize-btn" title="最小化" aria-label="最小化">–</button>
            </div>
            <div class="divider"></div>
            <div class="panel-content">
                <a id="reward_finish">结束脚本</a>
                <a id="reward_clean">重置搜索</a>
                <p>电脑: <span class="count" id="pc_count">${countInfo.pc_count}</span> / ${DEFAULT_CONFIG.max_pc}</p>
                <p>手机: <span class="count" id="ph_count">${countInfo.ph_count}</span> / ${DEFAULT_CONFIG.max_ph}</p>
                <p id="reward_info"></p>
                <p>下次搜索: <span id="countdown">--</span></p>
            </div>
            <div class="mini-icon" style="display:none;">B</div>
        </div>
    `);

    // 事件绑定
    $("body").on("click", "#reward_clean", CleanCount);
    $("body").on("click", "#reward_finish", Finish);

    // 最小化与还原逻辑
    const rewardTool = document.getElementById('reward_tool');
    const minimizeBtn = rewardTool.querySelector('.minimize-btn');
    const panelContent = rewardTool.querySelector('.panel-content');
    const header = rewardTool.querySelector('.header');
    const miniIcon = rewardTool.querySelector('.mini-icon');
    const divider = rewardTool.querySelector('.divider');

    // 记录上次正常位置
    let lastNormalPosition = {
        right: rewardTool.style.right,
        bottom: rewardTool.style.bottom,
        left: rewardTool.style.left,
        top: rewardTool.style.top
    };

    minimizeBtn.onclick = function (e) {
        e.stopPropagation();
        // 记录最小化前的位置
        lastNormalPosition = {
            right: rewardTool.style.right,
            bottom: rewardTool.style.bottom,
            left: rewardTool.style.left,
            top: rewardTool.style.top
        };
        rewardTool.classList.add('minimized');
        panelContent.style.display = 'none';
        header.style.display = 'none';
        divider.style.display = 'none';
        miniIcon.style.display = '';
        // 最小化后固定到右下角
        rewardTool.style.right = '30px';
        rewardTool.style.bottom = '30px';
        rewardTool.style.left = 'auto';
        rewardTool.style.top = 'auto';
    };
    miniIcon.onclick = function (e) {
        e.stopPropagation();
        rewardTool.classList.remove('minimized');
        panelContent.style.display = '';
        header.style.display = '';
        divider.style.display = '';
        miniIcon.style.display = 'none';
        // 还原到右下角
        rewardTool.style.right = '30px';
        rewardTool.style.bottom = '30px';
        rewardTool.style.left = 'auto';
        rewardTool.style.top = 'auto';
    };

    // 拖动功能（悬浮框和最小化图标都可拖动）
    let isDragging = false, dragOffsetX = 0, dragOffsetY = 0;
    function dragStart(e) {
        if (e.target.classList.contains('minimize-btn')) return;
        isDragging = true;
        dragOffsetX = e.clientX - rewardTool.getBoundingClientRect().left;
        dragOffsetY = e.clientY - rewardTool.getBoundingClientRect().top;
        rewardTool.style.transition = 'none';
    }
    function dragMove(e) {
        if (!isDragging) return;
        let x = e.clientX - dragOffsetX;
        let y = e.clientY - dragOffsetY;
        // 限制在窗口内
        x = Math.max(0, Math.min(window.innerWidth - rewardTool.offsetWidth, x));
        y = Math.max(0, Math.min(window.innerHeight - rewardTool.offsetHeight, y));
        rewardTool.style.left = x + 'px';
        rewardTool.style.top = y + 'px';
        rewardTool.style.right = 'auto';
        rewardTool.style.bottom = 'auto';
    }
    function dragEnd() {
        isDragging = false;
        rewardTool.style.transition = '';
    }
    header.addEventListener('mousedown', dragStart);
    miniIcon.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', dragMove);
    document.addEventListener('mouseup', dragEnd);

    // 主循环
    let timer = null;
    StartSearch();

    function StartSearch() {
        const config = GetConfig();
        if (config.pc_count >= DEFAULT_CONFIG.max_pc && config.ph_count >= DEFAULT_CONFIG.max_ph) {
            ShowInfo(config);
            return;
        }

        const interval = GetRandomInterval();
        let remainingTime = interval / 1000;
        UpdateCountdown(remainingTime);

        timer = setInterval(() => {
            remainingTime--;
            UpdateCountdown(remainingTime);
            if (remainingTime <= 0) {
                clearInterval(timer);
                PerformSearch();
                StartSearch();
            }
        }, 1000);
    }

    function PerformSearch() {
        const config = GetConfig();
        if ((!IsPhone() && config.pc_count >= DEFAULT_CONFIG.max_pc) || (IsPhone() && config.ph_count >= DEFAULT_CONFIG.max_ph)) return;

        try {
            const searchInput = document.getElementById("sb_form_q") || document.querySelector("input[name='q']");
            const searchButton = document.getElementById("sb_form_go") || document.querySelector("button[type='submit']");
            if (!searchInput) throw new Error("搜索框未找到");
            if (!searchButton) throw new Error("搜索按钮未找到");

            searchInput.value = GetRandomSearchTerm();
            if (IsPhone()) config.ph_count++; else config.pc_count++;
            GM_setValue("bing_reward", JSON.stringify(config));
            ShowInfo(config);
            searchButton.click();
        } catch (error) {
            setTimeout(StartSearch, 5000); // 出错后5秒重试
        }
    }

    // 手机检测
    function IsPhone() {
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobileUA = /mobile|android|iphone|ipad|touch/i.test(userAgent);
        const isSmallScreen = window.innerWidth < 768;
        return isMobileUA || isSmallScreen;
    }

    // 获取配置
    function GetConfig() {
        let config = GM_getValue("bing_reward");
        const today = new Date().toISOString().split("T")[0]; // 简化日期处理
        if (!config || JSON.parse(config).date !== today) {
            config = { date: today, pc_count: 0, ph_count: 0 };
        } else {
            config = JSON.parse(config);
        }
        return config;
    }

    // 显示信息
    function ShowInfo(config) {
        document.getElementById("pc_count").textContent = config.pc_count;
        document.getElementById("ph_count").textContent = config.ph_count;
        document.getElementById("reward_info").textContent = config.pc_count < DEFAULT_CONFIG.max_pc || config.ph_count < DEFAULT_CONFIG.max_ph ? '未完成' : '今日已完成';
    }

    // 更新倒计时
    function UpdateCountdown(seconds) {
        document.getElementById("countdown").textContent = seconds > 0 ? `${Math.floor(seconds)}秒` : '搜索中...';
    }

    // 重置计数
    function CleanCount() {
        const today = new Date().toISOString().split("T")[0];
        GM_setValue("bing_reward", JSON.stringify({ date: today, pc_count: 0, ph_count: 0 }));
        alert("计数已重置");
        location.reload();
    }

    // 结束脚本
    function Finish() {
        const today = new Date().toISOString().split("T")[0];
        GM_setValue("bing_reward", JSON.stringify({ date: today, pc_count: DEFAULT_CONFIG.max_pc, ph_count: DEFAULT_CONFIG.max_ph }));
        clearInterval(timer);
        alert("脚本已结束");
    }

    // 随机搜索词生成
    function GetRandomSearchTerm() {
        const topics = ['AI', '区块链', '云计算', '编程', '安全', '天气', '电影', '健康', '旅游', '美食'];
        const actions = ['学习', '制作', '找到', '优化', '下载'];
        const qualifiers = ['最新', '免费', '简单', '高效', new Date().getFullYear() + '年'];
        const useQualifier = Math.random() > 0.5;
        const action = actions[Math.floor(Math.random() * actions.length)];
        const topic = topics[Math.floor(Math.random() * topics.length)];
        const qualifier = qualifiers[Math.floor(Math.random() * qualifiers.length)];
        return useQualifier ? `${action} ${qualifier} ${topic}` : `${action} ${topic}`;
    }

    // 随机时间间隔
    function GetRandomInterval() {
        const min = DEFAULT_CONFIG.min_interval * 1000;
        const max = DEFAULT_CONFIG.max_interval * 1000;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
})();
