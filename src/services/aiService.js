// 字节跳动火山方舟 - Seedream 4.5 图像生成服务
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SeedreamAIService {
    constructor() {
        // 检查环境变量
        if (!process.env.VOLC_API_KEY) {
            console.warn('⚠️  警告: 未配置火山方舟API密钥 (VOLC_API_KEY)，AI生成功能将不可用');
            this.enabled = false;
            return;
        }

        if (!process.env.VOLC_SEEDREAM_ENDPOINT) {
            console.warn('⚠️  警告: 未配置火山方舟推理接入点 (VOLC_SEEDREAM_ENDPOINT)，AI生成功能将不可用');
            console.warn('    请访问 https://console.volcengine.com/ark/region:ark+cn-beijing/endpoint 创建推理接入点');
            this.enabled = false;
            return;
        }

        this.enabled = true;
        this.apiKey = process.env.VOLC_API_KEY;
        this.endpointId = process.env.VOLC_SEEDREAM_ENDPOINT;
        this.apiEndpoint = 'https://ark.cn-beijing.volces.com/api/v3/images/generations';
    }

    /**
     * 基于Seedream 4.5的文生图功能
     * @param {string} prompt - 提示词
     * @param {object} options - 配置选项
     * @returns {Promise<Array>} 生成的图片列表
     */
    async textToImage(prompt, options = {}) {
        if (!this.enabled) {
            throw new Error('AI服务未启用，请配置API密钥');
        }

        const {
            size = '2048x2048',  // 默认2048x2048
            model = 'doubao-seedream-4.5',  // 默认使用Seedream 4.5
            responseFormat = 'url',  // url 或 b64_json
            watermark = false,  // 是否添加水印
            stream = false,  // 是否流式输出
        } = options;

        try {
            // 使用推理接入点 ID 而不是模型名称
            const modelToUse = this.endpointId || model;

            const requestBody = {
                model: modelToUse,
                prompt: prompt,
                size: size,
                response_format: responseFormat,
                watermark: watermark,
                stream: stream,
            };

            console.log('🔬 调用火山方舟 API:', {
                endpoint: this.apiEndpoint,
                model: modelToUse,
                size: size
            });

            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('火山方舟API错误响应:', errorText);
                throw new Error(`API错误 ${response.status}: ${errorText}`);
            }

            const data = await response.json();

            // 处理响应数据
            if (data.error) {
                throw new Error(`生成失败: ${data.error.message} (代码: ${data.error.code})`);
            }

            if (data.data && Array.isArray(data.data)) {
                return data.data.map((item, index) => {
                    if (item.error) {
                        return {
                            id: `img_${Date.now()}_${index}`,
                            error: item.error,
                        };
                    }

                    let imageUrl;
                    if (responseFormat === 'url' && item.url) {
                        imageUrl = item.url;
                    } else if (responseFormat === 'b64_json' && item.b64_json) {
                        // base64格式
                        imageUrl = `data:image/jpeg;base64,${item.b64_json}`;
                    }

                    return {
                        id: `img_${Date.now()}_${index}`,
                        url: imageUrl,
                        size: item.size || size,
                    };
                });
            }

            throw new Error('响应格式异常');
        } catch (error) {
            console.error('Seedream AI生成错误:', error);
            throw new Error(`图像生成失败: ${error.message}`);
        }
    }

    /**
     * 图生图 - 基于参考图片生成新图
     * @param {string} prompt - 提示词
     * @param {Array<string>} images - 参考图片Base64或URL数组
     * @param {object} options - 配置选项
     * @returns {Promise<Array>} 生成的图片列表
     */
    async imageToImage(prompt, images, options = {}) {
        if (!this.enabled) {
            throw new Error('AI服务未启用，请配置API密钥');
        }

        const {
            size = '2048x2048',
            model = 'doubao-seedream-4.5',
            responseFormat = 'url',
            watermark = false,
        } = options;

        try {
            const requestBody = {
                model: model,
                prompt: prompt,
                image: images,  // 支持单图或多图
                size: size,
                response_format: responseFormat,
                watermark: watermark,
            };

            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API错误 ${response.status}: ${errorText}`);
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(`生成失败: ${data.error.message}`);
            }

            if (data.data && Array.isArray(data.data)) {
                return data.data.map((item, index) => {
                    if (item.error) {
                        return {
                            id: `img_${Date.now()}_${index}`,
                            error: item.error,
                        };
                    }

                    let imageUrl;
                    if (responseFormat === 'url' && item.url) {
                        imageUrl = item.url;
                    } else if (responseFormat === 'b64_json' && item.b64_json) {
                        imageUrl = `data:image/jpeg;base64,${item.b64_json}`;
                    }

                    return {
                        id: `img_${Date.now()}_${index}`,
                        url: imageUrl,
                        size: item.size || size,
                    };
                });
            }

            throw new Error('响应格式异常');
        } catch (error) {
            console.error('Seedream图生图错误:', error);
            throw new Error(`图像生成失败: ${error.message}`);
        }
    }

    /**
     * 生成组图 - 自动判断关联图片
     * @param {string} prompt - 提示词
     * @param {object} options - 配置选项
     * @returns {Promise<Array>} 生成的图片列表
     */
    async generateSequential(prompt, options = {}) {
        if (!this.enabled) {
            throw new Error('AI服务未启用，请配置API密钥');
        }

        const {
            size = '2048x2048',
            model = 'doubao-seedream-4.5',
            responseFormat = 'url',
            watermark = false,
            maxImages = 15,
        } = options;

        try {
            const requestBody = {
                model: model,
                prompt: prompt,
                size: size,
                response_format: responseFormat,
                watermark: watermark,
                sequential_image_generation: 'auto',
                sequential_image_generation_options: {
                    max_images: maxImages,
                },
            };

            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API错误 ${response.status}: ${errorText}`);
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(`生成失败: ${data.error.message}`);
            }

            if (data.data && Array.isArray(data.data)) {
                return data.data.map((item, index) => {
                    if (item.error) {
                        return {
                            id: `img_${Date.now()}_${index}`,
                            error: item.error,
                        };
                    }

                    let imageUrl;
                    if (responseFormat === 'url' && item.url) {
                        imageUrl = item.url;
                    } else if (responseFormat === 'b64_json' && item.b64_json) {
                        imageUrl = `data:image/jpeg;base64,${item.b64_json}`;
                    }

                    return {
                        id: `img_${Date.now()}_${index}`,
                        url: imageUrl,
                        size: item.size || size,
                    };
                });
            }

            throw new Error('响应格式异常');
        } catch (error) {
            console.error('Seedream组图生成错误:', error);
            throw new Error(`图像生成失败: ${error.message}`);
        }
    }

    /**
     * 下载远程图片到本地
     */
    async downloadImage(imageUrl, savePath) {
        const response = await fetch(imageUrl, {
            // 火山引擎URL可能需要设置Referer等，这里添加基础配置
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            }
        });
        if (!response.ok) throw new Error('下载图片失败');

        const buffer = await response.arrayBuffer();
        await fs.ensureDir(path.dirname(savePath));
        await fs.writeFile(savePath, Buffer.from(buffer));
        return savePath;
    }

    /**
     * 检查服务是否可用
     */
    isEnabled() {
        return this.enabled;
    }
}

export default new SeedreamAIService();
