#  拾词

一本极简且好用的词语笔记本。

[![Static Badge](https://img.shields.io/badge/Chrome_Web_Store-%E6%8B%BE%E8%AF%8D-blue?logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/%E6%8B%BE%E8%AF%8D/hoejicmjdnmpicbiaocjepmlidjgpokn?hl=zh-CN)

本人为js初学者，欢迎各位指导。

---

[使用教程](https://my-awesome.blog/posts/guide-shici/)

##  项目结构

```text
.
├── manifest.json             # 扩展配置文件
├── pages/
│   ├── popup.html            # 扩展弹窗页面
│   └── options.html          # API Key 配置页面
├── scripts/
│   ├── background.js         # Service Worker 主逻辑
│   ├── card.js               # 实现网页上的单词卡片弹窗
│   ├── content.js            # 内容脚本：划词、波浪线标记
│   ├── indexedBD.js          # IndexedDB 操作封装
│   ├── option.js             # 选项页交互逻辑
│   ├── popup.js              # 弹窗搜索交互逻辑
│   ├── prompt.js             # AI 翻译提示词
│   └── requestAI.js          # 请求 DeepSeek API 封装
├── css/
│   ├── popup.css
│   └── option.css
└── images/                   # 扩展图标
```
## 开发计划

- [x] 增加翻译句子段落的功能
- [x] 在popup页面的单词搜索以及单词卡片弹窗上实现删除功能

- ### 以下内容预计在下一次更新中实现
- [ ] 增加代码可读性
- [ ] 增加单词导出导入功能
- [ ] 简单设计一下样式！！！

- ### 以下内容还在规划中
- [ ] 跨元素选取单词时，忽略边缘的空格
- [ ] 每次添加、删除单词时，所有标签页同步标记
- [ ] 代码性能优化，例如使用CSS Custom Highlight API或持续的连接
- [ ] 保存单词的同时保存单词所在的句子作为例句
- [ ] 支持多种翻译源以及语种
- [ ] 实现自定义快捷键


---
##  许可证

MIT License
