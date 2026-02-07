# Nexus Art Gallery

一个现代化的艺术画廊系统，支持作品上传、浏览和 AI 艺术创作。

## 🎨 功能特性

- 👤 用户注册与登录（学生/教师）
- 🖼️ 作品上传与管理
- 🤖 AI 艺术创作（基于火山引擎 Seedream 4.5）
- 🎭 作品画廊浏览
- 👨‍💼 用户个人中心

## 🚀 部署到 Sealos

详细部署说明请查看 [SEALOS_DEPLOY.md](./SEALOS_DEPLOY.md)

### 快速开始

1. 上传整个项目到 Sealos
2. 配置环境变量（见 `.env.example`）
3. Sealos 会自动构建并部署

## 📦 技术栈

- **后端**: Express.js
- **前端**: Vite + Vanilla JavaScript
- **AI**: 火山引擎 Seedream 4.5
- **存储**: JSON 文件数据库 + 本地文件存储

## 🔧 本地开发

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入你的 API 密钥

# 开发模式
npm run dev

# 生产构建
npm run build
npm start
```

## 📝 环境变量

```env
VOLC_API_KEY=你的火山引擎API密钥
VOLC_SEEDREAM_ENDPOINT=你的Seedream端点ID
PORT=3000
```

## 📄 许可证

MIT License
