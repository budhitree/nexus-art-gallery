# Nexus Art Gallery - Sealos 部署指南

## 📦 项目简介

这是一个基于 Express + Vite 的艺术画廊系统，支持用户注册、作品上传、AI 生成艺术作品等功能。

## 🚀 快速部署到 Sealos

### 方法一：使用 Dockerfile 部署

1. **上传项目文件**
   - 将整个 `art_gallary` 文件夹上传到 Sealos

2. **配置环境变量**
   - 在 Sealos 控制台中设置以下环境变量：
     ```
     NODE_ENV=production
     PORT=3000
     VOLC_API_KEY=你的火山引擎API密钥
     VOLC_SEEDREAM_ENDPOINT=你的Seedream端点ID
     ```

3. **构建并部署**
   - Sealos 会自动检测 Dockerfile 并构建镜像
   - 容器端口：3000
   - 建议配置持久化存储卷：
     - `/app/public/uploads` - 用户上传的图片
     - `/app/db.json` - 数据库文件

### 方法二：使用 Sealos 应用模板

1. **创建新应用**
   - 在 Sealos 控制台选择"从 Git 仓库部署"
   - 或者选择"从 Dockerfile 部署"

2. **配置应用**
   - 镜像：node:18-alpine
   - 端口：3000
   - 环境变量：见上方

3. **配置存储卷**
   - 创建持久化存储卷用于保存用户数据和上传文件

## 📋 必需的环境变量

| 变量名 | 说明 | 是否必需 |
|--------|------|----------|
| `NODE_ENV` | 运行环境（production） | 是 |
| `PORT` | 服务端口（默认3000） | 否 |
| `VOLC_API_KEY` | 火山引擎 API 密钥 | AI功能必需 |
| `VOLC_SEEDREAM_ENDPOINT` | Seedream 端点 ID | AI功能必需 |

## 💾 持久化存储

建议配置以下持久化存储卷：

1. **上传文件存储**
   - 挂载路径：`/app/public/uploads`
   - 用途：保存用户上传的图片和 AI 生成的作品

2. **数据库文件**
   - 挂载路径：`/app/db.json`
   - 用途：保存用户信息和作品数据

## 🔧 构建说明

项目使用多阶段构建：
1. 安装依赖（npm install）
2. 构建前端（npm run build）
3. 启动生产服务器（npm start）

## 📝 注意事项

1. **首次部署**
   - 系统会自动创建 `db.json` 文件
   - 默认没有管理员账号，需要通过注册页面创建

2. **AI 功能**
   - 如果不配置 `VOLC_API_KEY`，AI 生成功能将不可用
   - 其他功能（上传、浏览、用户管理）仍可正常使用

3. **端口配置**
   - 容器内部端口：3000
   - Sealos 会自动分配外部访问地址

4. **数据安全**
   - 建议定期备份 `db.json` 和 `uploads` 目录
   - 生产环境建议使用真实数据库（如 PostgreSQL、MongoDB）

## 🌐 访问应用

部署成功后，Sealos 会提供一个公网访问地址，格式类似：
```
https://your-app-name.cloud.sealos.io
```

## 🔍 故障排查

1. **容器启动失败**
   - 检查环境变量是否正确配置
   - 查看容器日志获取详细错误信息

2. **AI 功能不可用**
   - 确认 `VOLC_API_KEY` 和 `VOLC_SEEDREAM_ENDPOINT` 已正确配置
   - 检查 API 密钥是否有效

3. **上传文件丢失**
   - 确认已配置持久化存储卷
   - 检查存储卷挂载路径是否正确

## 📞 技术支持

如有问题，请查看项目文档或提交 Issue。
