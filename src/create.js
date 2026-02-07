import './style.css'
import './create.css'
import './cursor.css'
import { AuthService } from './userManager.js'
import { initCursor } from './utils/cursor.js'
import { ProgressBar } from './utils/progressBar.js'
import { validatePrompt } from './utils/validation.js'
import { ApiClient } from './utils/apiClient.js'

// --- Custom AI Logic for Create Page ---

document.addEventListener('DOMContentLoaded', () => {
    // 检查用户登录状态
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser) {
        // 未登录，重定向到首页
        alert('请先登录后再使用 AI 创作功能');
        window.location.href = '/';
        return;
    }

    initCursor();
    initCreatePageFunctions();
});

function initCreatePageFunctions() {
    const btnGenerate = document.getElementById('btn-generate');
    const statusDisplay = document.getElementById('status-display');
    const previewContainer = document.getElementById('preview-container');
    const aiResultsWrapper = document.getElementById('ai-results-wrapper');
    const emptyState = document.querySelector('.empty-state');
    const progressOverlay = document.getElementById('ai-progress-overlay');

    // 使用 ProgressBar 类
    const progressBar = new ProgressBar('progress-fill');

    // Inputs
    const inputSubject = document.getElementById('input-subject');
    const inputBackground = document.getElementById('input-background');
    const inputStylePreset = document.getElementById('input-style-preset');
    const inputStyleCustom = document.getElementById('input-style-custom');
    const inputSupplement = document.getElementById('input-supplement');
    const inputScale = document.getElementById('ai-scale');

    // Result Actions
    const btnRegenerate = document.getElementById('regenerate-btn');
    const btnDownload = document.getElementById('download-selected-btn');
    const btnSave = document.getElementById('save-to-gallery-btn');

    let currentImages = []; // Array of image objects
    let selectedImages = new Set();
    let currentPrompt = "";

    function updateStatus(msg, type = 'info') {
        statusDisplay.textContent = msg;
        statusDisplay.className = `status-msg ${type}`;
        statusDisplay.classList.remove('hidden');
        if (type !== 'error') {
            setTimeout(() => statusDisplay.classList.add('hidden'), 5000);
        }
    }

    updateStatus('ready', '准备就绪，请填写左侧信息开始创作');
    initPromptSuggestions();

    // --- Suggestions & History ---
    const defaultSuggestions = [
        "柔和光影", "8k分辨率", "赛博朋克", "极简主义", "电影质感",
        "虚幻引擎5", "大师级作品", "辛烷渲染", "特写镜头"
    ];
    let promptHistory = JSON.parse(localStorage.getItem('nexus_prompt_history') || '{}');

    function initPromptSuggestions() {
        const container = document.getElementById('prompt-chips');
        if (!container) return;

        container.innerHTML = '';

        // 1. Frequent History (Usage >= 3)
        const frequent = Object.entries(promptHistory)
            .filter(([_, count]) => count >= 3)
            .sort((a, b) => b[1] - a[1]) // Sort by frequency
            .slice(0, 5) // Top 5
            .map(([word]) => word);

        frequent.forEach(word => {
            const chip = createChip(word, true);
            container.appendChild(chip);
        });

        // 2. Default Suggestions (exclude frequent to avoid dupes)
        defaultSuggestions.filter(w => !frequent.includes(w)).forEach(word => {
            const chip = createChip(word, false);
            container.appendChild(chip);
        });
    }

    function createChip(text, isHistory) {
        const chip = document.createElement('span');
        chip.className = `prompt-chip ${isHistory ? 'history' : ''}`;
        chip.textContent = text;
        chip.title = isHistory ? '常用提示词' : '推荐提示词';

        chip.addEventListener('click', () => {
            const current = inputSupplement.value.trim();
            if (current) {
                if (!current.includes(text)) {
                    inputSupplement.value = current + ', ' + text;
                }
            } else {
                inputSupplement.value = text;
            }
            // Feedback animation
            chip.style.transform = 'scale(0.95)';
            setTimeout(() => chip.style.transform = '', 100);
        });

        return chip;
    }

    function trackPromptUsage(fullPrompt) {
        // Split prompt by comma and track each meaningful part
        const parts = fullPrompt.split(/[,，]/).map(p => p.trim()).filter(p => p.length > 1);
        let changed = false;

        parts.forEach(part => {
            // Skip structural prefixes if accidentally included (though UI separates them)
            if (part.startsWith('Subject:') || part.startsWith('Style:')) return;

            promptHistory[part] = (promptHistory[part] || 0) + 1;
            changed = true;
        });

        if (changed) {
            localStorage.setItem('nexus_prompt_history', JSON.stringify(promptHistory));
            // Refresh chips next time or now? Maybe too distracting to refresh now.
            // Let's refresh on next page load or explicitly if needed.
        }
    }

    // --- Logic ---
    function buildPrompt() {
        const parts = [];
        if (inputSubject.value.trim()) parts.push(`Subject: ${inputSubject.value.trim()}`);
        if (inputBackground.value.trim()) parts.push(`Background: ${inputBackground.value.trim()}`);

        let style = inputStyleCustom.value.trim();
        if (!style && inputStylePreset.value) {
            style = inputStylePreset.value;
        } else if (style && inputStylePreset.value) {
            style = `${inputStylePreset.value}, ${style}`;
        }
        if (style) parts.push(`Style: ${style}`);

        if (inputSupplement.value.trim()) parts.push(`Details: ${inputSupplement.value.trim()}`);

        return parts.join(', ');
    }

    // 构建用于显示的提示词（不带标签）
    function buildDisplayPrompt() {
        const parts = [];
        if (inputSubject.value.trim()) parts.push(inputSubject.value.trim());
        if (inputBackground.value.trim()) parts.push(inputBackground.value.trim());

        let style = inputStyleCustom.value.trim();
        if (!style && inputStylePreset.value) {
            style = inputStylePreset.value;
        } else if (style && inputStylePreset.value) {
            style = `${inputStylePreset.value}, ${style}`;
        }
        if (style) parts.push(style);

        if (inputSupplement.value.trim()) parts.push(inputSupplement.value.trim());

        return parts.join(', ');
    }

    btnGenerate.addEventListener('click', async () => {
        const prompt = buildPrompt();
        const displayPrompt = buildDisplayPrompt(); // 用于显示的提示词

        if (prompt.length < 10) {
            updateStatus('⚠️ 请填写更多细节，描述太短可能无法生成高质量作品', 'error');
            return;
        }

        trackPromptUsage(inputSupplement.value); // Track usage
        trackPromptUsage(inputSubject.value);

        const scale = inputScale.value;

        // UI Interaction
        btnGenerate.disabled = true;
        progressOverlay.classList.remove('hidden');
        progressBar.start(); // 使用 ProgressBar 类

        try {
            await new Promise(r => setTimeout(r, 500)); // Sim start delay

            // 使用 ApiClient
            const data = await ApiClient.post('/api/ai/generate', {
                prompt: prompt,
                options: {
                    scale: scale,
                    model: 'doubao-seedream-4.5'
                }
            });

            progressBar.complete(); // 完成进度条

            // Success
            currentImages = data.data.images;
            currentPrompt = displayPrompt; // 保存显示用的提示词

            renderResults(currentImages);

        } catch (e) {
            console.error(e);
            updateStatus(`Error: ${e.message}`, 'error');
        } finally {
            setTimeout(() => {
                progressOverlay.classList.add('hidden');
                progressBar.reset();
                btnGenerate.disabled = false;
            }, 500);
        }
    });

    function renderResults(images) {
        emptyState.classList.add('hidden');
        aiResultsWrapper.classList.remove('hidden');

        const grid = document.getElementById('results-grid');
        grid.innerHTML = images.map((img, idx) => `
            <div class="result-item" data-id="${img.id}">
                <img src="${img.url}" />
            </div>
        `).join('');

        // Bind clicks
        grid.querySelectorAll('.result-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = item.dataset.id;
                if (selectedImages.has(id)) {
                    selectedImages.delete(id);
                    item.classList.remove('selected');
                } else {
                    selectedImages.add(id);
                    item.classList.add('selected');
                }
                updateActionButtons();
            });
        });

        selectedImages.clear();
        updateActionButtons();
    }

    function updateActionButtons() {
        const hasSelection = selectedImages.size > 0;
        btnDownload.disabled = !hasSelection;
        btnSave.disabled = !hasSelection;

        btnDownload.textContent = hasSelection ? `下载 (${selectedImages.size})` : '下载';
        btnSave.textContent = hasSelection ? `保存到展览 (${selectedImages.size})` : '保存到展览';
    }

    // Reuse save logic
    btnSave.addEventListener('click', async () => {
        if (selectedImages.size === 0) return;

        const user = AuthService.getCurrentUser();
        if (!user) {
            alert('请先登录再保存作品（请返回首页登录）');
            return;
        }

        const title = prompt('为作品取个标题：');
        if (!title) return;

        btnSave.disabled = true;
        btnSave.textContent = '保存中...';

        try {
            // Construct matching structure for API
            const imageUrls = {};
            currentImages.forEach(img => { imageUrls[img.id] = img.url; });

            // 使用 ApiClient
            const response = await ApiClient.post('/api/ai/save-to-gallery', {
                imageIds: Array.from(selectedImages),
                title: title,
                prompt: currentPrompt,
                user: user.id || user,
                imageUrls: imageUrls
            });

            // 检查响应
            if (response.success) {
                alert(`保存成功！已保存 ${response.data.artworks?.length || selectedImages.size} 张图片`);
                selectedImages.clear();
                document.querySelectorAll('.result-item.selected').forEach(el => el.classList.remove('selected'));
                updateActionButtons();
            } else {
                alert('保存失败: ' + (response.error || '未知错误'));
            }
        } catch (e) {
            console.error(e);
            alert('保存失败: ' + e.message);
        } finally {
            btnSave.disabled = false;
            updateActionButtons();
        }
    });

    // 下载功能
    btnDownload.addEventListener('click', async () => {
        if (selectedImages.size === 0) return;

        btnDownload.disabled = true;
        const originalText = btnDownload.textContent;
        btnDownload.textContent = '下载中...';

        try {
            const selectedImagesList = Array.from(selectedImages);

            // 如果只有一张图片，直接下载
            if (selectedImagesList.length === 1) {
                const imageId = selectedImagesList[0];
                const image = currentImages.find(img => img.id === imageId);
                if (image) {
                    await downloadImage(image.url, `nexus-art-${imageId}.jpg`);
                }
            } else {
                // 多张图片，逐个下载
                for (let i = 0; i < selectedImagesList.length; i++) {
                    const imageId = selectedImagesList[i];
                    const image = currentImages.find(img => img.id === imageId);
                    if (image) {
                        btnDownload.textContent = `下载中 (${i + 1}/${selectedImagesList.length})`;
                        await downloadImage(image.url, `nexus-art-${imageId}.jpg`);
                        // 添加延迟避免浏览器阻止多个下载
                        if (i < selectedImagesList.length - 1) {
                            await new Promise(resolve => setTimeout(resolve, 500));
                        }
                    }
                }
            }

            alert(`成功下载 ${selectedImagesList.length} 张图片！`);
        } catch (e) {
            console.error('下载失败:', e);
            alert('下载失败: ' + e.message);
        } finally {
            btnDownload.disabled = false;
            btnDownload.textContent = originalText;
        }
    });

    // 下载单张图片的辅助函数
    async function downloadImage(url, filename) {
        try {
            // 获取图片数据
            const response = await fetch(url);
            const blob = await response.blob();

            // 创建下载链接
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();

            // 清理
            setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(blobUrl);
            }, 100);
        } catch (error) {
            console.error('下载图片失败:', error);
            throw error;
        }
    }

    // Regenerate just clears view for now or could trigger generate again
    btnRegenerate.addEventListener('click', () => {
        // Just focus back on input? Or clear result?
        emptyState.classList.remove('hidden');
        aiResultsWrapper.classList.add('hidden');
    });

}
