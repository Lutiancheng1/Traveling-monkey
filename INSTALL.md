# 安装指南

本指南将帮助您在不同平台上安装和配置微软Rewards自动搜索脚本-重构版。

## 📋 系统要求

### 支持的浏览器
- **Chrome** 88+
- **Firefox** 85+
- **Edge** 88+
- **Safari** 14+
- **Opera** 74+

### 必需的扩展
- **Tampermonkey** (推荐)
- **Greasemonkey** (Firefox)
- **Violentmonkey** (开源替代)
- **Stay** (Safari iOS)

## 🚀 快速安装

### 方法一：直接安装（推荐）

1. **安装用户脚本管理器**
   - Chrome/Edge: [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
   - Firefox: [Tampermonkey](https://addons.mozilla.org/firefox/addon/tampermonkey/) 或 [Greasemonkey](https://addons.mozilla.org/firefox/addon/greasemonkey/)
   - Safari: [Tampermonkey](https://apps.apple.com/app/tampermonkey/id1482490089)

2. **安装脚本**
   - 点击 [MS-Rewards-Auto-Search.user.js](./MS-Rewards-Auto-Search.user.js)
   - 在弹出的安装页面点击"安装"
   - 确认安装完成

3. **验证安装**
   - 访问 [必应搜索](https://www.bing.com)
   - 查看页面右下角是否出现设置按钮

### 方法二：手动安装

1. **复制脚本代码**
   - 打开 [MS-Rewards-Auto-Search.user.js](./MS-Rewards-Auto-Search.user.js)
   - 复制全部代码内容

2. **创建新脚本**
   - 打开Tampermonkey管理面板
   - 点击"创建新脚本"
   - 粘贴复制的代码
   - 保存脚本

## 📱 移动端安装

### iOS Safari + Stay

1. **安装Stay应用**
   - 从 [App Store](https://apps.apple.com/app/stay-for-safari/id1591620171) 下载Stay
   - 在Safari设置中启用Stay扩展

2. **安装脚本**
   - 在Safari中打开脚本文件
   - 点击分享按钮选择"Stay"
   - 确认安装

### Android Chrome + Tampermonkey

1. **安装Tampermonkey**
   - 从Chrome网上应用店安装Tampermonkey
   - 或使用Kiwi Browser等支持扩展的浏览器

2. **按照桌面端方法安装脚本**

## ⚙️ 配置说明

### 首次使用配置

1. **访问必应搜索**
   ```
   https://www.bing.com
   ```

2. **打开设置面板**
   - 点击页面右下角的齿轮图标
   - 或使用快捷键 `Ctrl+Shift+M` (桌面端)

3. **基础配置**
   - **搜索目标**: 选择30次或40次
   - **最小间隔**: 建议设置为3-5秒
   - **最大间隔**: 建议设置为8-15秒
   - **自适应模式**: 建议开启

### 高级配置选项

#### 搜索间隔设置
```
推荐配置：
- 保守模式: 最小5秒，最大15秒
- 平衡模式: 最小3秒，最大10秒
- 激进模式: 最小1秒，最大5秒（风险较高）
```

#### 自适应间隔
- **开启**: 脚本会根据网络响应自动调整间隔
- **关闭**: 使用固定的随机间隔

#### 调试模式
- **开启**: 显示详细的执行日志
- **关闭**: 仅显示基本信息

## 🔧 故障排除

### 常见问题

#### 1. 脚本未加载
**症状**: 访问必应搜索页面没有看到设置按钮

**解决方案**:
- 检查用户脚本管理器是否已启用
- 确认脚本在管理面板中处于启用状态
- 刷新页面或重启浏览器
- 检查浏览器是否阻止了脚本执行

#### 2. 搜索不执行
**症状**: 点击开始搜索后没有反应

**解决方案**:
- 检查网络连接
- 确认已登录微软账户
- 清除浏览器缓存和Cookie
- 检查是否被必应限制访问

#### 3. 热搜词获取失败
**症状**: 显示"获取热搜词失败"错误

**解决方案**:
- 检查网络连接
- 等待几分钟后重试
- 手动刷新热搜词
- 检查防火墙或代理设置

#### 4. 移动端显示异常
**症状**: 界面布局错乱或按钮无法点击

**解决方案**:
- 刷新页面
- 检查浏览器缩放比例
- 尝试横屏/竖屏切换
- 清除浏览器缓存

### 高级故障排除

#### 启用调试模式
1. 打开脚本设置面板
2. 开启"调试模式"
3. 打开浏览器开发者工具 (F12)
4. 查看控制台输出的详细日志

#### 重置脚本设置
1. 打开设置面板
2. 点击"设备面板"标签
3. 点击"清除所有缓存"
4. 页面会自动刷新并重置所有设置

#### 检查脚本权限
确保脚本具有以下权限：
- `GM_getValue` / `GM_setValue`: 数据存储
- `GM_xmlhttpRequest`: 网络请求
- `GM_addStyle`: 样式注入
- `GM_registerMenuCommand`: 菜单注册

## 🔄 更新脚本

### 自动更新
Tampermonkey会自动检查脚本更新，通常在以下情况触发：
- 浏览器启动时
- 访问脚本匹配的页面时
- 手动检查更新时

### 手动更新
1. 打开Tampermonkey管理面板
2. 找到"微软Rewards自动搜索脚本-重构版"
3. 点击脚本名称进入编辑页面
4. 点击"设置"标签
5. 点击"检查更新"

### 强制重新安装
如果遇到更新问题：
1. 在管理面板中删除旧版本脚本
2. 重新安装最新版本
3. 重新配置设置（建议先导出设置）

## 📞 获取帮助

### 官方支持
- 🐛 [报告Bug](https://github.com/your-repo/ms-rewards-auto-search/issues/new?template=bug_report.md)
- 💡 [功能建议](https://github.com/your-repo/ms-rewards-auto-search/issues/new?template=feature_request.md)
- 📚 [查看文档](https://github.com/your-repo/ms-rewards-auto-search/wiki)

### 社区支持
- 💬 [讨论区](https://github.com/your-repo/ms-rewards-auto-search/discussions)
- 📧 邮件支持: [your-email@example.com](mailto:your-email@example.com)

### 提交问题时请包含
1. **浏览器版本和操作系统**
2. **用户脚本管理器版本**
3. **脚本版本号**
4. **详细的错误描述**
5. **复现步骤**
6. **控制台错误日志**（如有）

---

**注意**: 安装和使用本脚本即表示您同意遵守相关服务条款和使用协议。请合理使用，避免过度频繁的操作。