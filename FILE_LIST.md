# Sealos 部署文件清单

## 📦 文件夹大小
总计：约 3.5MB

## 📋 文件列表

### 根目录文件
```
art_gallary/
├── .dockerignore          # Docker 构建忽略文件
├── .env.example           # 环境变量示例文件
├── Dockerfile             # Docker 镜像构建文件
├── package.json           # Node.js 依赖配置
├── package-lock.json      # 依赖版本锁定文件
├── server.js              # Express 后端服务器
├── vite.config.js         # Vite 构建配置
├── index.html             # 主页面
├── create.html            # AI 创作页面
├── README.md              # 项目说明
└── SEALOS_DEPLOY.md       # Sealos 部署指南
```

### 源代码目录 (src/)
```
src/
├── main.js                # 主页面逻辑
├── create.js              # 创作页面逻辑
├── userManager.js         # 用户管理模块
├── style.css              # 主样式
├── create.css             # 创作页面样式
├── upload.css             # 上传组件样式
├── ai-generator.css       # AI 生成器样式
├── about.css              # 关于页面样式
├── cursor.css             # 光标效果样式
├── immersive.css          # 沉浸式效果样式
├── services/              # 服务层
│   ├── aiService.js       # AI 服务（火山引擎）
│   ├── authService.js     # 认证服务
│   └── galleryService.js  # 画廊服务
└── utils/                 # 工具函数
    ├── apiClient.js       # API 客户端
    ├── cursor.js          # 光标效果
    ├── modal.js           # 模态框组件
    ├── progressBar.js     # 进度条组件
    └── validation.js      # 表单验证
```

### 公共资源目录 (public/)
```
public/
├── images/                # 静态图片资源
│   ├── art1.png
│   ├── art2.png
│   ├── art3.png
│   └── hero.png
├── uploads/               # 用户上传目录（需持久化）
│   └── .gitkeep
└── vite.svg               # Vite 图标
```

## 🔑 关键文件说明

### 1. Dockerfile
- 基于 `node:18-alpine` 镜像
- 自动安装依赖、构建前端、启动服务
- 暴露端口：3000

### 2. server.js
- Express 后端服务器
- 提供 API 接口：登录、注册、上传、AI 生成等
- 使用 JSON 文件作为数据库（db.json）

### 3. .env.example
- 环境变量模板
- 需要配置火山引擎 API 密钥才能使用 AI 功能

### 4. package.json
- 依赖包：express, cors, multer, fs-extra, dotenv
- 开发依赖：vite
- 脚本：dev, build, start, prod

## 📊 依赖项

### 生产依赖
- express: ^5.2.1
- cors: ^2.8.5
- dotenv: ^17.2.3
- fs-extra: ^11.3.3
- multer: ^2.0.2

### 开发依赖
- vite: ^7.2.4

## 🚀 部署步骤

1. **上传文件**
   - 将整个 `art_gallary` 文件夹上传到 Sealos

2. **配置环境变量**（在 Sealos 控制台）
   ```
   NODE_ENV=production
   PORT=3000
   VOLC_API_KEY=你的API密钥
   VOLC_SEEDREAM_ENDPOINT=你的端点ID
   ```

3. **配置持久化存储**
   - `/app/public/uploads` - 用户上传的图片
   - `/app/db.json` - 数据库文件

4. **启动应用**
   - Sealos 会自动检测 Dockerfile 并构建
   - 容器启动后会自动运行 `npm start`

## ⚠️ 注意事项

1. **不包含的文件**（已在 .dockerignore 中排除）
   - node_modules（会在构建时重新安装）
   - dist（会在构建时重新生成）
   - .git（版本控制文件）
   - .env（敏感信息，需在 Sealos 中配置）
   - db.json（会在运行时自动创建）
   - 已有的上传文件（需要持久化存储）

2. **首次运行**
   - 系统会自动创建空的 db.json
   - uploads 目录已包含 .gitkeep 占位文件

3. **数据持久化**
   - 务必配置持久化存储卷，否则重启后数据会丢失

## 📞 支持

详细部署说明请查看 `SEALOS_DEPLOY.md`
