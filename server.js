import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import aiService from './src/services/aiService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploaded images
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
fs.ensureDirSync(UPLOADS_DIR);
// Serve the 'public' folder so uploads are accessible 
// (Vite serves public in dev, but for our backend uploads we might want a specific route or just let Vite proxy handle it if we put them in public?)
// Actually, if we put files in `public/uploads`, Vite dev server will serve them if we access /uploads/...
// BUT, we are writing to `public/uploads` at runtime. Vite might not pick them up immediately without restart in some configs, but usually public is statically served.
// Let's rely on serving them statically via Express essentially if we were running prod, but in Dev, Vite handles public.
// However, since we are running the server alongside Vite, let's also serve them from here just in case, but usually we access via relative URL.
app.use('/uploads', express.static(UPLOADS_DIR));


// Database (JSON file)
const DB_FILE = path.join(__dirname, 'db.json');
if (!fs.existsSync(DB_FILE)) {
    fs.writeJsonSync(DB_FILE, { users: {}, artworks: [] });
}

const readDb = async () => fs.readJson(DB_FILE);
const writeDb = async (data) => fs.writeJson(DB_FILE, data, { spaces: 2 });

// 统一响应格式辅助函数
const successResponse = (data) => ({ success: true, data });
const errorResponse = (error) => ({ success: false, error });

// Multer Setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    }
});
const upload = multer({ storage });

// Routes

// Login
app.post('/api/login', async (req, res) => {
    const { userId, password } = req.body;
    if (!userId || !password) {
        return res.status(400).json(errorResponse('需要账号和密码'));
    }

    const db = await readDb();

    if (!db.users[userId]) {
        return res.status(401).json(errorResponse('账号不存在'));
    }

    const user = db.users[userId];

    if (user.password !== password) {
        return res.status(401).json(errorResponse('密码错误'));
    }

    const { password: _, ...userInfo } = user;
    res.json(successResponse(userInfo));
});

// Register
app.post('/api/register', async (req, res) => {
    const { userId, password, name, userType } = req.body;

    if (!userId || !password || !name || !userType) {
        return res.status(400).json(errorResponse('请填写完整信息'));
    }

    // 验证格式
    if (userType === 'student' && !/^\d{8}$/.test(userId)) {
        return res.status(400).json(errorResponse('学号格式错误，应为8位数字'));
    }
    if (userType === 'teacher' && !/^\d{7}$/.test(userId)) {
        return res.status(400).json(errorResponse('工号格式错误，应为7位数字'));
    }

    const db = await readDb();

    if (db.users[userId]) {
        return res.status(409).json(errorResponse('该账号已存在'));
    }

    db.users[userId] = {
        id: userId,
        name: name,
        userType: userType,
        password: password,
        joined: new Date().toISOString(),
        uploads: []
    };

    await writeDb(db);

    const { password: _, ...userInfo } = db.users[userId];
    res.json(successResponse(userInfo));
});

// Get user profile
app.get('/api/user/:userId', async (req, res) => {
    const { userId } = req.params;
    const db = await readDb();

    if (!db.users[userId]) {
        return res.status(404).json(errorResponse('用户不存在'));
    }

    const { password: _, ...userInfo } = db.users[userId];
    res.json(successResponse(userInfo));
});

// Update user profile
app.put('/api/user/:userId', async (req, res) => {
    const { userId } = req.params;
    const { name, oldPassword, newPassword, currentUserId } = req.body;

    if (userId !== currentUserId) {
        return res.status(403).json(errorResponse('无权修改他人信息'));
    }

    const db = await readDb();

    if (!db.users[userId]) {
        return res.status(404).json(errorResponse('用户不存在'));
    }

    const user = db.users[userId];

    if (newPassword) {
        if (!oldPassword || user.password !== oldPassword) {
            return res.status(401).json(errorResponse('原密码错误'));
        }
        user.password = newPassword;
    }

    if (name) {
        user.name = name;
    }

    await writeDb(db);

    const { password: _, ...userInfo } = user;
    res.json(successResponse(userInfo));
});

// Upload
app.post('/api/upload', upload.single('image'), async (req, res) => {
    try {
        const { title, prompt, user: userId } = req.body;
        const file = req.file;

        if (!file || !userId) {
            return res.status(400).json(errorResponse('缺少文件或用户ID'));
        }

        const db = await readDb();

        // Construct public URL
        const imageUrl = `/uploads/${file.filename}`;

        const newArt = {
            id: Date.now().toString(),
            title: title || 'Untitled',
            artist: `Student_${userId}`,
            desc: "Student Submission",
            image: imageUrl,
            prompt: prompt,
            uploadedAt: new Date().toISOString()
        };

        db.artworks.push(newArt);

        // Also update user record
        if (db.users[userId]) {
            if (!db.users[userId].uploads) db.users[userId].uploads = [];
            db.users[userId].uploads.push(newArt.id);
        }

        await writeDb(db);

        res.json(successResponse(newArt));
    } catch (err) {
        console.error(err);
        res.status(500).json(errorResponse('上传失败'));
    }
});

// Gallery (Combined)
app.get('/api/gallery', async (req, res) => {
    try {
        const db = await readDb();
        // Return mostly newest first
        res.json(successResponse(db.artworks.reverse()));
    } catch (err) {
        res.status(500).json(errorResponse('获取画廊失败'));
    }
});

// Delete artwork
app.delete('/api/artwork/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { user: userId } = req.body;

        if (!userId) {
            return res.status(401).json(errorResponse('未登录'));
        }

        const db = await readDb();
        const artworkIndex = db.artworks.findIndex(art => art.id === id);

        if (artworkIndex === -1) {
            return res.status(404).json(errorResponse('作品不存在'));
        }

        const artwork = db.artworks[artworkIndex];

        // 验证权限：作者或管理员可以删除
        const isAdmin = userId === 'admin';
        const isOwner = artwork.artist === `Student_${userId}`;

        if (!isAdmin && !isOwner) {
            return res.status(403).json(errorResponse('无权删除此作品'));
        }

        // 删除本地文件（如果是本地上传的）
        if (artwork.image && artwork.image.startsWith('/uploads/')) {
            const filePath = path.join(UPLOADS_DIR, path.basename(artwork.image));
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // 从数据库中删除
        db.artworks.splice(artworkIndex, 1);

        // 从用户记录中删除（如果不是管理员删除的）
        if (!isAdmin && db.users[userId] && db.users[userId].uploads) {
            db.users[userId].uploads = db.users[userId].uploads.filter(uploadId => uploadId !== id);
        }

        await writeDb(db);

        res.json(successResponse({ message: '作品已删除' }));
    } catch (err) {
        console.error(err);
        res.status(500).json(errorResponse('删除失败'));
    }
});

// 获取所有学生列表（仅管理员）
app.get('/api/students', async (req, res) => {
    try {
        const db = await readDb();
        const students = Object.keys(db.users).filter(id => id !== 'admin');
        res.json(successResponse(students));
    } catch (err) {
        res.status(500).json(errorResponse('获取学生列表失败'));
    }
});

// AI生成接口
app.post('/api/ai/generate', async (req, res) => {
    try {
        const { prompt, options = {} } = req.body;

        if (!prompt) {
            return res.status(400).json(errorResponse('缺少提示词'));
        }

        if (!aiService.isEnabled()) {
            return res.status(503).json(errorResponse('AI服务未配置，请在 .env 文件中配置 VOLC_API_KEY'));
        }

        // 使用文生图接口
        const images = await aiService.textToImage(prompt, {
            size: options.scale || '2048x2048',
            model: 'doubao-seedream-4.5',
            responseFormat: 'url',
            watermark: false,
        });

        res.json(successResponse({
            images: images,
            prompt: prompt,
        }));
    } catch (error) {
        console.error('AI生成错误:', error);
        res.status(500).json(errorResponse(error.message || '生成失败'));
    }
});

// AI生成图片保存到图库
app.post('/api/ai/save-to-gallery', async (req, res) => {
    try {
        const { imageIds, title, prompt, user: userId, imageUrls } = req.body;

        if (!userId) {
            return res.status(400).json(errorResponse('未登录'));
        }

        if (!imageIds || imageIds.length === 0) {
            return res.status(400).json(errorResponse('未选择图片'));
        }

        const db = await readDb();
        const savedArtworks = [];

        for (const imageId of imageIds) {
            const imageUrl = imageUrls[imageId];
            if (!imageUrl) continue;

            // 下载图片到本地
            const filename = `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
            const localPath = path.join(UPLOADS_DIR, filename);

            try {
                await aiService.downloadImage(imageUrl, localPath);
                const localUrl = `/uploads/${filename}`;

                // 保存到数据库
                const newArt = {
                    id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
                    title: title || 'AI生成作品',
                    artist: `Student_${userId}`,
                    desc: "AI Generated Art",
                    image: localUrl,
                    prompt: prompt,
                    uploadedAt: new Date().toISOString()
                };

                db.artworks.push(newArt);

                // 更新用户记录
                if (db.users[userId]) {
                    if (!db.users[userId].uploads) db.users[userId].uploads = [];
                    db.users[userId].uploads.push(newArt.id);
                }

                savedArtworks.push(newArt);
            } catch (downloadError) {
                console.error(`下载图片失败 ${imageId}:`, downloadError);
                // 继续处理其他图片
                continue;
            }
        }

        if (savedArtworks.length === 0) {
            return res.status(500).json(errorResponse('保存失败，所有图片都无法下载'));
        }

        await writeDb(db);

        res.json(successResponse({
            message: `成功保存 ${savedArtworks.length} 张作品到图库`,
            artworks: savedArtworks
        }));
    } catch (error) {
        console.error('保存AI作品错误:', error);
        res.status(500).json(errorResponse(error.message || '保存失败'));
    }
});

// 生产环境：服务构建后的前端文件
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));

    // 所有非 API 和非 uploads 的请求都返回 index.html
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
            res.sendFile(path.join(__dirname, 'dist', 'index.html'));
        }
    });
}

app.listen(PORT, '0.0.0.0', () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log(`网络访问: http://0.0.0.0:${PORT}`);
    if (aiService.isEnabled()) {
        console.log('✅ AI 服务已启用 (Seedream 4.5)');
    } else {
        console.log('⚠️  AI生成功能未配置，请在 .env 中设置 VOLC_API_KEY');
    }
});
