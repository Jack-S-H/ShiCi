#  拾词

一本极简且好用的词语笔记本。

从[谷歌商店](https://chromewebstore.google.com/detail/%E6%8B%BE%E8%AF%8D/hoejicmjdnmpicbiaocjepmlidjgpokn?hl=zh-CN)安装

本人为js初学者，欢迎各位的指导。

---

##  使用教程

-   **划线取词**：在任意网页上，**双击** 英文单词或 **选中单词** 按 **`S` 键**，即可触发翻译。
-   **单词标记**：翻译过的单词会自动添加上 **红色波浪下划线**，鼠标移动到划线范围会自动弹出单词卡片
-   **扩展设置**：这里做成了单词本页面，在这里可以删除单词，需要使用浏览器自带的搜索
-   **popup页面**：点击扩展图标，可以在搜索框中快速查找已标记的单词或者手动录入单词。
-   **AI 翻译**：通过集成 **DeepSeek API**，获取中文释义、词性、音标以及记忆建议。

##  项目结构

```text
.
├── manifest.json             # 扩展配置文件
├── pages/
│   ├── popup.html            # 扩展弹窗页面
│   └── options.html          # API Key 配置页面
├── scripts/
│   ├── background.js         # Service Worker 主逻辑
│   ├── snatch.js             # 内容脚本：划词、波浪线标记
│   ├── requestAI.js          # 请求 DeepSeek API 封装
│   ├── indexedBD.js          # IndexedDB 操作封装
│   ├── option.js             # 选项页交互逻辑
│   └── popup.js              # 弹窗搜索交互逻辑
├── css/
│   ├── popup.css
│   └── option.css
├── prompt/
│   └── en2zh.js              # AI 翻译提示词
└── images/                   # 扩展图标
```
## 开发计划

- [ ] 在popup页面增加翻译句子段落的功能
- [ ] 跨元素选取单词时，忽略边缘的空格
- [ ] 每次添加、删除单词时，其他网页也同步标记
- [ ] 在popup页面的单词搜索以及单词卡片弹窗上实现删除功能
- [ ] 代码性能优化，例如使用CSS Custom Highlight API或持续的连接
- [ ] 保存单词的同时保存单词所在的句子

---
##  许可证

MIT License
