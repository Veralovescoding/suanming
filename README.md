# 🐱 咕噜相师 (Gulu Master)

一个专业且温暖的 AI 八字命理分析工具，灵感来自星辰与猫咪。

## ✨ 功能特性
- **八字分析**：基于出生日期、时间、性别及城市进行深度命理分析。
- **全球城市搜索**：内置智能全球城市数据库，自动获取精确地理位置。
- **Prompt 版本管理**：支持保存、命名及切换多个算命逻辑模板。
- **RAG 知识库**：支持上传私人命理典籍（.txt），让 AI 学习您的专属流派。
- **算命记录回看**：自动保存历史分析结果，支持随时查阅复盘。
- **参数调优**：支持调整 AI 采样温度（Temperature），控制输出的创造力。
- **沉浸式 UI**：参考 Moonly 风格的星空暗黑主题。

## 🚀 快速启动

### 1. 环境准备
- Node.js 18+
- 一个兼容 OpenAI 格式的 LLM API Key

### 2. 安装
```bash
git clone <your-repo-url>
cd bazi-fortune-app
npm install
```

### 3. 配置
在根目录创建 `.env` 文件：
```env
PORT=8787
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=your_api_key_here
LLM_MODEL=gpt-4o-mini
```

### 4. 运行
```bash
npm start
```
访问 `http://localhost:8787` 开启旅程。

## 🛠️ 技术栈
- **Frontend**: Vanilla JS, CSS3, HTML5
- **Backend**: Node.js, Express
- **LLM**: GPT-4o-mini / Kimi / Qwen (OpenAI API Compatible)
- **Data**: Local JSON persistence

## 📜 免责声明
本工具仅供娱乐参考，不构成医疗、法律、投资等专业建议。
