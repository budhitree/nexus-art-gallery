# Sealos Kubernetes 部署指南

## 📋 配置文件说明

本项目包含以下 Kubernetes 配置文件：

- `deployment.yaml` - 应用部署配置
- `service.yaml` - 服务配置
- `pvc.yaml` - 持久化存储卷配置

## 🚀 在 Sealos 上部署

### 方式一：使用 Sealos 应用模板（推荐）

1. **在 Sealos 控制台中选择「应用管理」**

2. **点击「从 YAML 部署」或「导入 YAML」**

3. **按顺序部署以下文件**：

   **第 1 步：创建持久化存储卷**
   ```bash
   # 复制 pvc.yaml 的内容并粘贴到 Sealos
   ```

   **第 2 步：部署应用**
   ```bash
   # 复制 deployment.yaml 的内容并粘贴到 Sealos
   # ⚠️ 记得修改环境变量中的 API 密钥！
   ```

   **第 3 步：创建服务**
   ```bash
   # 复制 service.yaml 的内容并粘贴到 Sealos
   ```

4. **配置外网访问**
   - 在 Sealos 中为服务配置 Ingress 或负载均衡器
   - 或者使用 Sealos 的自动域名功能

### 方式二：使用 Sealos 应用商店模板

如果 Sealos 支持从 Git 仓库直接部署：

1. **选择「从 Git 部署」**
2. **填入仓库信息**：
   - 仓库地址：`https://github.com/budhitree/nexus-art-gallery`
   - 分支：`master`
   - Dockerfile 路径：`./Dockerfile`

3. **配置环境变量**（在 Sealos 界面中）：
   ```
   NODE_ENV=production
   PORT=3000
   VOLC_API_KEY=你的实际API密钥
   VOLC_SEEDREAM_ENDPOINT=你的实际端点ID
   ```

4. **配置存储卷**：
   - 上传文件：`/app/public/uploads` (5GB)
   - 数据库：`/app/data` (1GB)

5. **配置端口**：
   - 容器端口：`3000`
   - 服务端口：`3000`

## ⚠️ 重要：修改环境变量

在部署前，**必须**修改 `deployment.yaml` 中的环境变量：

```yaml
env:
- name: VOLC_API_KEY
  value: "你的火山引擎API密钥"  # ← 替换这里
- name: VOLC_SEEDREAM_ENDPOINT
  value: "你的Seedream端点ID"  # ← 替换这里
```

从你本地的 `.env` 文件中获取这些值。

## 📦 镜像构建

### 选项 A：让 Sealos 自动构建

如果 Sealos 支持从 Dockerfile 构建，它会自动：
1. 从 GitHub 拉取代码
2. 使用 Dockerfile 构建镜像
3. 部署到集群

### 选项 B：手动构建并推送镜像

如果需要手动构建：

```bash
# 1. 构建镜像
cd art_gallary
docker build -t ghcr.io/budhitree/nexus-art-gallery:latest .

# 2. 登录 GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u budhitree --password-stdin

# 3. 推送镜像
docker push ghcr.io/budhitree/nexus-art-gallery:latest
```

然后在 Sealos 中使用镜像地址：`ghcr.io/budhitree/nexus-art-gallery:latest`

## 🔍 部署后检查

1. **查看 Pod 状态**
   ```bash
   kubectl get pods
   ```

2. **查看日志**
   ```bash
   kubectl logs -f deployment/nexus-art-gallery
   ```

3. **查看服务**
   ```bash
   kubectl get svc nexus-art-gallery
   ```

## 🌐 访问应用

部署成功后，通过以下方式访问：

1. **Sealos 自动分配的域名**
   - 在 Sealos 控制台查看应用的访问地址

2. **配置自定义域名**
   - 在 Sealos 中配置 Ingress
   - 绑定你的域名

## 📝 常见问题

### 1. Pod 启动失败

检查日志：
```bash
kubectl describe pod <pod-name>
kubectl logs <pod-name>
```

常见原因：
- 环境变量未正确配置
- 镜像拉取失败
- 存储卷挂载失败

### 2. 无法访问应用

- 检查 Service 是否正常
- 检查端口配置是否正确
- 确认已配置外网访问（Ingress 或 LoadBalancer）

### 3. 数据丢失

- 确认 PVC 已正确创建和挂载
- 检查存储卷的状态

## 💡 提示

- 首次部署可能需要 3-5 分钟（构建镜像 + 安装依赖）
- 建议先使用小规格测试（0.5 核 / 512MB）
- 生产环境建议配置自动扩缩容
