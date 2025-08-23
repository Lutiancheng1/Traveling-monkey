# 微软Rewards自动搜索脚本-重构版 v2.2.0

🚀 **全新重构版本** - 模块化架构，智能自适应，现代化UI设计

## 📋 功能特性

### 🎯 核心功能
- **智能自适应搜索间隔**：1-120秒可调，根据网络状况自动优化
- **灵活搜索目标**：支持30次或40次搜索选择
- **多源热搜词**：整合百度、微博、头条、抖音等平台热搜
- **现代化UI**：Liquid Glass风格设计，支持桌面端和移动端
- **完整缓存管理**：智能缓存热搜词，支持一键清除
- **移动端调试**：集成Eruda调试控制台

### 🔧 技术特性
- **模块化架构**：ES6+设计，代码结构清晰
- **异步编程**：Promise/async-await模式
- **响应式设计**：适配各种屏幕尺寸
- **智能错误处理**：完善的异常捕获和恢复机制
- **性能优化**：防抖节流，内存管理

## 🚀 快速开始

### 安装要求
- 支持油猴脚本的浏览器（Chrome、Firefox、Edge、Safari等）
- 安装Tampermonkey、Greasemonkey或Violentmonkey扩展

### 安装步骤
1. 安装油猴扩展到浏览器
2. 点击 [安装脚本](./MS-Rewards-Auto-Search.user.js)
3. 在油猴管理界面确认安装
4. 访问 [必应搜索](https://www.bing.com) 开始使用

## 📖 使用指南

### 基础操作
1. **启动脚本**：访问必应搜索页面，脚本自动激活
2. **打开设置**：点击页面右下角的设置按钮
3. **配置参数**：
   - 搜索目标：选择30次或40次
   - 搜索间隔：设置最小和最大间隔（1-120秒）
   - 自适应模式：开启智能间隔调整
4. **开始搜索**：点击"开始搜索"按钮

### 高级功能

#### 🎛️ 自适应间隔
- **智能调整**：根据网络响应自动优化搜索间隔
- **范围设置**：在用户设定的最小-最大间隔内动态调整
- **性能优化**：避免过于频繁的请求被检测

#### 🔥 热搜词管理
- **多源获取**：从4个主流平台获取热搜词
- **智能缓存**：24小时缓存，减少网络请求
- **手动刷新**：支持一键刷新热搜词
- **缓存清理**：完整的缓存管理功能

#### 📱 移动端支持
- **响应式UI**：完美适配手机屏幕
- **触摸优化**：针对触摸操作优化
- **调试控制台**：移动端可开启Eruda调试

## ⚙️ 配置说明

### 搜索设置
```javascript
// 搜索间隔配置
搜索间隔: {
  最小间隔: 1-60秒,    // 最快搜索间隔
  最大间隔: 2-120秒,   // 最慢搜索间隔
  自适应模式: 开启/关闭  // 智能调整间隔
}

// 搜索目标
搜索次数: 30次 | 40次   // 每日搜索目标
```

### 热搜词源
- **百度热搜**：实时热点话题
- **微博热搜**：社交媒体热点
- **头条热搜**：新闻资讯热点
- **抖音热搜**：短视频平台热点

## 🛠️ 技术架构

### 模块设计
```
├── 核心管理器 (CoreManager)
├── 搜索执行器 (SearchExecutor)
├── 热搜词管理器 (HotWordsManager)
├── UI管理器 (UIManager)
├── 存储管理器 (StorageManager)
└── 工具函数 (Utils)
```

### 关键特性
- **模块化设计**：每个功能独立封装
- **事件驱动**：基于事件的组件通信
- **状态管理**：集中式状态管理
- **错误边界**：完善的错误处理机制

## 🔧 开发指南

### 本地开发
```bash
# 克隆项目
git clone https://github.com/your-repo/ms-rewards-auto-search.git

# 进入目录
cd ms-rewards-auto-search

# 安装依赖（如果有）
npm install

# 开发模式
npm run dev
```

### 代码规范
- 使用ES6+语法
- 遵循JSDoc注释规范
- 采用模块化设计模式
- 完善的错误处理

## 📝 更新日志

### v2.2.0 (2024-01-XX)
- 🆕 新增智能自适应搜索间隔功能
- 🔧 修复最小间隔控制问题
- 🔧 修复清除缓存功能
- 💄 优化UI交互体验
- 📚 完善文档和注释

### v2.1.0
- 🆕 重构整体架构
- 🆕 新增Liquid Glass风格UI
- 🆕 支持多源热搜词获取
- 🆕 移动端调试支持

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

### 贡献流程
1. Fork本项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

### 问题反馈
- 🐛 [报告Bug](https://github.com/your-repo/ms-rewards-auto-search/issues/new?template=bug_report.md)
- 💡 [功能建议](https://github.com/your-repo/ms-rewards-auto-search/issues/new?template=feature_request.md)

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源协议。

## ⚠️ 免责声明

本脚本仅供学习和研究使用，请遵守微软服务条款。使用本脚本所产生的任何后果由用户自行承担。

## 🙏 致谢

感谢所有为本项目贡献代码和建议的开发者！

---

**⭐ 如果这个项目对你有帮助，请给个Star支持一下！**

📧 联系方式：[your-email@example.com](mailto:your-email@example.com)
🏠 项目主页：[https://github.com/your-repo/ms-rewards-auto-search](https://github.com/your-repo/ms-rewards-auto-search)