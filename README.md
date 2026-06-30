#  拾词

一本极简且好用的词语笔记本。

![Static Badge](https://img.shields.io/badge/Chrome_Web_Store-link?logo=googlechrome&logoColor=yellow&link=https%3A%2F%2Fchromewebstore.google.com%2Fdetail%2F%25E6%258B%25BE%25E8%25AF%258D%2Fhoejicmjdnmpicbiaocjepmlidjgpokn%3Fhl%3Dzh-CN%26utm_source%3Dext_sidebar)

本人为js初学者，欢迎各位指导。

---

##  使用教程

- **标记单词**：
  - **双击** 英文单词
  - **选中** 单词按`S`键

​	标记的单词会添加 **红色波浪下划线**，鼠标移动到划线范围会自动弹	出单词卡片

- **翻译句子**
  - **选中** 一段英文按`T`键,会在左上角显示译文卡片

- **扩展设置**：这里做成了单词本页面，在这里可以删除单词，需要使用浏览器自带的搜索
- **popup页面**：点击扩展图标或按ctrl+m组合键，可以在搜索框中快速查找已标记的单词或者手动录入单词。
- **AI 翻译**：首次使用需要输入 **DeepSeek API key**，获取中文释义、词性、音标以及记忆建议。

##  项目结构

```text
.
├── manifest.json             # 扩展配置文件
├── pages/
│   ├── popup.html            # 扩展弹窗页面
│   └── options.html          # API Key 配置页面
├── scripts/
│   ├── background.js         # Service Worker 主逻辑
│   ├── content.js            # 内容脚本：划词、波浪线标记
│   ├── requestAI.js          # 请求 DeepSeek API 封装
│   ├── indexedBD.js          # IndexedDB 操作封装
│   ├── option.js             # 选项页交互逻辑
│   └── popup.js              # 弹窗搜索交互逻辑
│   └── card.js               # 实现网页上的单词卡片弹窗
├── css/
│   ├── popup.css
│   └── option.css
├── prompt/
│   └── en2zh.js              # AI 翻译提示词
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
