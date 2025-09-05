{
  "name": "油猴脚本开发规范（中文）",
  "scope": "javascript",
  "rules": {
    "indent_size": 2,
    "max_line_length": 100,
    "semi": true,
    "quotes": "single",
    "no_trailing_spaces": true,
    "trim_final_newlines": true,

    "variable_naming": "camelCase",
    "function_naming": "camelCase",
    "class_naming": "PascalCase",
    "const_upper_for_magic": true,         // 魔法常量用全大写

    "require_jsdoc": true,                 // 所有函数需要 JSDoc
    "require_param_types": true,           // JSDoc 中必须标注 @param 类型
    "require_return_types": true,          // 若有返回值需要 @returns
    "disallow_unused_vars": true,
    "prefer_const": true,
    "no_var": true,
    "arrow_function_prefer": true,
    "eqeqeq": true,

    "require_header_comment": true,
    "header_comment_template": [
      "// ==UserScript==",
      "// @name         ${name}（必填：脚本名称）",
      "// @namespace    https://tampermonkey.net/",
      "// @version      ${version}（必填：语义化，如 0.1.0）",
      "// @description  ${description}（必填：一句话描述脚本作用）",
      "// @author       ${author}",
      "// @match        ${match}（建议用 @match 精确限定）",
      "// @exclude      ${exclude}（可选：排除的地址）",
      "// @include      ${include}（可选：广义匹配，少用）",
      "// @run-at       document-idle（可选：可改成 document-start/idle/end）",
      "// @noframes     true（可选：避免在 iframe 内执行）",
      "// @connect      ${domains}（可选：GM_xmlhttpRequest 需要跨域时声明域名）",
      "// @require      ${require}（可选：外部库，如 dayjs）",
      "// @resource     ${resource}（可选：静态资源，如 CSS）",
      "// @icon         https://www.google.com/s2/favicons?sz=64&domain=${domain}",
      "// @grant        GM_addStyle",
      "// @grant        GM_getValue",
      "// @grant        GM_setValue",
      "// @grant        GM_registerMenuCommand",
      "// @grant        GM_xmlhttpRequest",
      "// @grant        unsafeWindow",
      "// ==/UserScript=="
    ]
  },

  "snippets": [
    {
      "prefix": "tm-header-min",
      "description": "最小可用脚本头",
      "body": [
        "// ==UserScript==",
        "// @name         ${1:脚本名称}",
        "// @namespace    https://tampermonkey.net/",
        "// @version      ${2:0.1.0}",
        "// @description  ${3:脚本描述}",
        "// @author       ${4:你}",
        "// @match        ${5:https://example.com/*}",
        "// @run-at       document-idle",
        "// @grant        none",
        "// ==/UserScript=="
      ]
    },
    {
      "prefix": "tm-header-pro",
      "description": "专业版脚本头（含跨域/资源/外链）",
      "body": [
        "// ==UserScript==",
        "// @name         ${1:脚本名称}",
        "// @namespace    https://tampermonkey.net/",
        "// @version      ${2:0.1.0}",
        "// @description  ${3:脚本描述（一句话）}",
        "// @author       ${4:你}",
        "// @match        ${5:https://example.com/*}",
        "// @exclude      ${6:https://example.com/logout*}",
        "// @run-at       document-idle",
        "// @noframes     true",
        "// @connect      ${7:api.example.com}",
        "// @require      ${8:https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js}",
        "// @resource     ${9:style} ${10:https://cdn.jsdelivr.net/npm/modern-normalize/modern-normalize.css}",
        "// @icon         https://www.google.com/s2/favicons?sz=64&domain=example.com",
        "// @grant        GM_addStyle",
        "// @grant        GM_getValue",
        "// @grant        GM_setValue",
        "// @grant        GM_registerMenuCommand",
        "// @grant        GM_xmlhttpRequest",
        "// @grant        unsafeWindow",
        "// ==/UserScript=="
      ]
    },
    {
      "prefix": "tm-waitFor",
      "description": "等待元素（MutationObserver 版）",
      "body": [
        "/**",
        " * 等待单个元素出现",
        " * @param {string} selector CSS 选择器",
        " * @param {number} [timeout=10000] 超时毫秒",
        " * @returns {Promise<Element>}",
        " */",
        "function waitFor(selector, timeout = 10000) {",
        "  return new Promise((resolve, reject) => {",
        "    const el = document.querySelector(selector);",
        "    if (el) return resolve(el);",
        "    const obs = new MutationObserver(() => {",
        "      const found = document.querySelector(selector);",
        "      if (found) { obs.disconnect(); resolve(found); }",
        "    });",
        "    obs.observe(document.documentElement, { childList: true, subtree: true });",
        "    setTimeout(() => { obs.disconnect(); reject(new Error('waitFor 超时: ' + selector)); }, timeout);",
        "  });",
        "}"
      ]
    },
    {
      "prefix": "tm-spa-route",
      "description": "监听单页应用路由变化",
      "body": [
        "const onUrlChange = (() => {",
        "  const handlers = new Set();",
        "  const hook = (type) => {",
        "    const raw = history[type];",
        "    history[type] = function() {",
        "      const res = raw.apply(this, arguments);",
        "      window.dispatchEvent(new Event('tm-urlchange'));",
        "      return res;",
        "    };",
        "  };",
        "  hook('pushState'); hook('replaceState');",
        "  window.addEventListener('popstate', () => window.dispatchEvent(new Event('tm-urlchange')));",
        "  window.addEventListener('tm-urlchange', () => handlers.forEach(h => h(location.href)));",
        "  return (fn) => { handlers.add(fn); return () => handlers.delete(fn); };",
        "})();"
      ]
    },
    {
      "prefix": "tm-storage",
      "description": "GM 存储封装（带版本迁移）",
      "body": [
        "const STORE_KEY = 'APP_STATE_V1';",
        "const VERSION = 1;",
        "function loadState() {",
        "  const raw = GM_getValue(STORE_KEY, null);",
        "  if (!raw) return { __v: VERSION };",
        "  try {",
        "    const obj = JSON.parse(raw);",
        "    if ((obj.__v|0) < VERSION) return migrate(obj);",
        "    return obj;",
        "  } catch { return { __v: VERSION }; }",
        "}",
        "function saveState(obj) { GM_setValue(STORE_KEY, JSON.stringify({ ...obj, __v: VERSION })); }",
        "function migrate(old) {",
        "  // 在此根据 old.__v 做结构升级",
        "  return { ...old, __v: VERSION };",
        "}"
      ]
    },
    {
      "prefix": "tm-logger",
      "description": "分级日志器",
      "body": [
        "const LOG_LEVEL = GM_getValue('DEBUG', 1); // 0:off 1:info 2:debug",
        "const log = {",
        "  info: (...a) => LOG_LEVEL >= 1 && console.log('[TM]', ...a),",
        "  warn: (...a) => console.warn('[TM]', ...a),",
        "  error: (...a) => console.error('[TM]', ...a),",
        "  debug: (...a) => LOG_LEVEL >= 2 && console.debug('[TM]', ...a)",
        "};"
      ]
    },
    {
      "prefix": "tm-menu",
      "description": "动态菜单（开关/清缓存）",
      "body": [
        "GM_registerMenuCommand('切换调试模式', () => {",
        "  const cur = GM_getValue('DEBUG', 1);",
        "  GM_setValue('DEBUG', cur ? 0 : 2);",
        "  alert('已切换 DEBUG=' + (cur ? 0 : 2) + '，请刷新页面');",
        "});",
        "GM_registerMenuCommand('清除缓存', () => {",
        "  GM_setValue('APP_STATE_V1', ''); alert('已清除');",
        "});"
      ]
    },
    {
      "prefix": "tm-fetch",
      "description": "跨域请求：优先 fetch，失败回退 GM_xmlhttpRequest",
      "body": [
        "/**",
        " * GET 请求（带回退）",
        " * @param {string} url 目标地址",
        " * @returns {Promise<any>}",
        " */",
        "async function httpGet(url) {",
        "  try {",
        "    const r = await fetch(url, { credentials: 'include' });",
        "    if (!r.ok) throw new Error('HTTP ' + r.status);",
        "    return await r.json();",
        "  } catch (e) {",
        "    return new Promise((resolve, reject) => {",
        "      GM_xmlhttpRequest({",
        "        method: 'GET',",
        "        url,",
        "        onload: (res) => {",
        "          try { resolve(JSON.parse(res.responseText)); } catch (err) { reject(err); }",
        "        },",
        "        onerror: reject",
        "      });",
        "    });",
        "  }",
        "}"
      ]
    },
    {
      "prefix": "tm-style",
      "description": "注入 CSS",
      "body": [
        "function addStyle(css) {",
        "  if (typeof GM_addStyle === 'function') { GM_addStyle(css); return; }",
        "  const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);",
        "}"
      ]
    },
    {
      "prefix": "tm-safe-timer",
      "description": "安全定时器（页面卸载时清理）",
      "body": [
        "const timers = new Set();",
        "function safeInterval(fn, ms) { const id = setInterval(fn, ms); timers.add(id); return id; }",
        "function safeTimeout(fn, ms) { const id = setTimeout(fn, ms); timers.add(id); return id; }",
        "window.addEventListener('beforeunload', () => { timers.forEach(clearInterval); timers.clear(); });"
      ]
    }
  ],

  "prepublish_checklist": [
    "【权限最小化】仅保留用到的 @grant；不用就删掉。",
    "【精确匹配】优先使用 @match；仅在必要时使用 @include。",
    "【跨域声明】使用 GM_xmlhttpRequest 时，@connect 列出域名。",
    "【文档完整】所有函数含 JSDoc：@param、@returns、说明。",
    "【错误处理】核心流程 try/catch + 兜底提示。",
    "【调试开关】保留菜单切换 DEBUG，发布前默认关闭或降级。",
    "【性能检查】避免频繁 DOM 查询，优先 MutationObserver / 节流防抖。",
    "【SPA 兼容】路由变化要监听（pushState/replaceState/popstate）。",
    "【样式隔离】注入 CSS 限定选择器前缀，避免污染页面。",
    "【版本语义化】version 遵循 semver；更新内容写进变更日志。"
  ]
}
