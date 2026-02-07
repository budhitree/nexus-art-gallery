import './style.css'
import './immersive.css'
import './about.css'
import './cursor.css'
import './upload.css'
import './ai-generator.css'
import { AuthService, GalleryService } from './userManager.js'
import { initCursor } from './utils/cursor.js'
import { Modal } from './utils/modal.js'
import { validateUserId, validatePassword, getValidationMessage } from './utils/validation.js'

// Curated Art Data
const defaultCollection = [
  {
    title: "雨中静谧",
    artist: "Synth_Mind",
    desc: "对氛围与孤独的沉思研究。艺术家运用数字笔触唤起独自伫立于柔和细雨中的感觉，仿佛时间在此刻静止。",
    image: "/images/art1.png",
    prompt: "电影镜头，孤独的身影伫立在微雨中，柔和忧郁的氛围，浅景深，8k分辨率，低饱和度色调"
  },
  {
    title: "浮世",
    artist: "Dream_Weaver",
    desc: "受浮世绘木刻版画启发，这部作品通过超现实主义与柔和的视角重新诠释了“浮世”，悬置了重力与信仰。",
    image: "/images/art2.png",
    prompt: "超现实浮世绘风格，漂浮的天空岛屿，柔和的粉彩，梦幻般的氛围，复杂的线条，artstation趋势"
  },
  {
    title: "光与几何",
    artist: "Geometry_Bot",
    desc: "对纯粹形式的探索。光线穿过不存在的材质发生折射，创造出一种诉说着美的数学基础的视觉和谐。",
    image: "/images/art3.png",
    prompt: "抽象3D几何，光线通过棱镜折射，焦散，干净的线条，极简构图，光线追踪，照片级真实，8k"
  },
  {
    title: "回声肖像",
    artist: "AI_Dreamer",
    desc: "一幅不仅仅捕捉面容，更捕捉记忆的数字肖像。模糊的线条暗示着转瞬即逝的瞬间，一种触不可及的存在的微弱回响。",
    image: "/images/art1.png",
    prompt: "双重曝光肖像，幽灵轮廓，褪色的记忆，空灵的雾，动态模糊，单色带微妙蓝色色调，情感丰富"
  },
  {
    title: "云端之上",
    artist: "Cloud_Surfer",
    desc: "梦境的景观。云层的空灵特质与锐利的地平线形成对比，邀请观者步入一个充满无限可能的世界。",
    image: "/images/art2.png",
    prompt: "云端之上的超现实景观，黄金时刻光照，不可能的建筑，梦核，柔软蓬松的云朵，广角镜头，宏伟"
  },
  {
    title: "透明度研究",
    artist: "Physics_Engine",
    desc: "极简主义的完美。这部作品剥离了背景，完全专注于光与玻璃之间的相互作用，揭示了透明之美。",
    image: "/images/art3.png",
    prompt: "玻璃纹理微距拍摄，光色散，色差，干净的白色背景，产品摄影风格，高细节"
  }
];

// Initialize dynamic collection
// collection starts empty or default, then updates
let collection = defaultCollection;
let filteredCollection = []; // 用于存储筛选后的结果
let currentSearchTerm = '';
let currentStudentFilter = '';

// 刷新画廊数据
async function refreshGallery() {
  try {
    collection = await GalleryService.getCombinedCollection(defaultCollection);
    filteredCollection = collection;
    applyFilters();
    renderGallery();
  } catch (e) {
    console.warn("Failed to refresh gallery", e);
  }
}

// 暴露到全局，供 AI 生成器调用
window.refreshGallery = refreshGallery;

document.addEventListener('DOMContentLoaded', async () => {
  // 检查用户登录状态
  const currentUser = AuthService.getCurrentUser();

  // 如果未登录，强制显示登录模态框
  if (!currentUser) {
    // 延迟一点以确保 DOM 完全加载
    setTimeout(() => {
      const authModal = document.getElementById('auth-modal');
      if (authModal) {
        authModal.classList.add('active', 'force-login');
        // 切换到登录标签页
        const loginTab = document.querySelector('[data-tab="login"]');
        if (loginTab) {
          loginTab.click();
        }
      }
    }, 100);
  }

  // Async load user content
  try {
    collection = await GalleryService.getCombinedCollection(defaultCollection);
    filteredCollection = collection;
  } catch (e) {
    console.warn("Failed to load local gallery", e);
  }

  renderGallery();
  initObserve();
  initModal();
  initNavbar();
  initImmersiveMode();
  initParallax();
  initCursor();
  initAuth();
  initUpload();
  initProfile();
  initSearch();
  initAdminFilters();
  updateNavbar();
});

// 沉浸模式逻辑
let currentIndex = 0;
let isPlaying = false;
let autoPlayTimer = null;
let intervalSeconds = 5;

function initImmersiveMode() {
  const startBtn = document.getElementById('start-immersive');
  const viewer = document.getElementById('immersive-viewer');
  if (!viewer) return;

  const closeBtn = viewer.querySelector('.immersive-close');
  const prevBtn = document.getElementById('prev-art');
  const nextBtn = document.getElementById('next-art');

  // 新增控制
  const playBtn = document.getElementById('toggle-play');
  const intervalInput = document.getElementById('autoplay-interval');

  if (!startBtn) return;

  startBtn.addEventListener('click', () => {
    openImmersive(0);
  });

  closeBtn.addEventListener('click', closeImmersive);

  prevBtn.addEventListener('click', () => {
    stopAutoPlay();
    navigateImmersive(-1);
  });

  nextBtn.addEventListener('click', () => {
    stopAutoPlay();
    navigateImmersive(1);
  });

  // 播放/暂停 切换
  if (playBtn) {
    playBtn.addEventListener('click', () => {
      if (isPlaying) stopAutoPlay();
      else startAutoPlay();
    });
  }

  // 时间间隔输入
  if (intervalInput) {
    intervalInput.addEventListener('change', (e) => {
      let val = parseInt(e.target.value);
      if (isNaN(val) || val < 2) val = 2; // 最小 2秒
      if (val > 60) val = 60;
      intervalSeconds = val;
      e.target.value = val;

      // 如果正在播放，重启计时器以应用新间隔
      if (isPlaying) {
        stopAutoPlay();
        startAutoPlay();
      }
    });
    // 防止交互时隐藏
    intervalInput.addEventListener('focus', () => {
      if (idleTimer) clearTimeout(idleTimer);
    });
  }

  // 键盘导航
  document.addEventListener('keydown', (e) => {
    if (!viewer.classList.contains('active')) return;

    resetIdleTimer();

    if (e.key === 'Escape') closeImmersive();
    if (e.key === 'ArrowLeft') { stopAutoPlay(); navigateImmersive(-1); }
    if (e.key === 'ArrowRight') { stopAutoPlay(); navigateImmersive(1); }
    if (e.key === ' ') { // 空格键切换
      e.preventDefault();
      if (isPlaying) stopAutoPlay();
      else startAutoPlay();
    }
  });

  // 空闲检测
  viewer.addEventListener('mousemove', resetIdleTimer);
  viewer.addEventListener('click', resetIdleTimer);
}

// 空闲逻辑
let idleTimer = null;
function resetIdleTimer() {
  const viewer = document.getElementById('immersive-viewer');
  if (!viewer.classList.contains('active')) return;

  viewer.classList.remove('hide-ui');

  if (idleTimer) clearTimeout(idleTimer);

  idleTimer = setTimeout(() => {
    const activeElement = document.activeElement;
    if (activeElement && activeElement.tagName === 'INPUT') return;
    viewer.classList.add('hide-ui');
  }, 3000); // 3秒超时
}

function startAutoPlay() {
  if (isPlaying) return;
  const playBtn = document.getElementById('toggle-play');
  isPlaying = true;
  if (playBtn) {
    playBtn.textContent = '⏸ 暂停';
    playBtn.classList.add('playing');
  }

  autoPlayTimer = setInterval(() => {
    navigateImmersive(1);
  }, intervalSeconds * 1000);
}

function stopAutoPlay() {
  if (!isPlaying) return;
  const playBtn = document.getElementById('toggle-play');
  isPlaying = false;
  if (playBtn) {
    playBtn.textContent = '▶ 播放';
    playBtn.classList.remove('playing');
  }

  if (autoPlayTimer) {
    clearInterval(autoPlayTimer);
    autoPlayTimer = null;
  }
}

function openImmersive(index) {
  const viewer = document.getElementById('immersive-viewer');
  viewer.classList.add('active');
  document.body.style.overflow = 'hidden';
  currentIndex = index;
  updateImmersiveContent();

  // 重置播放状态
  stopAutoPlay();
  resetIdleTimer();
}

function closeImmersive() {
  const viewer = document.getElementById('immersive-viewer');
  viewer.classList.remove('active');
  document.body.style.overflow = '';
  stopAutoPlay();
}

function navigateImmersive(direction) {
  currentIndex += direction;
  // 使用筛选后的集合
  const displayCollection = filteredCollection.length > 0 ? filteredCollection : collection;
  // 循环播放
  if (currentIndex < 0) currentIndex = displayCollection.length - 1;
  if (currentIndex >= displayCollection.length) currentIndex = 0;

  updateImmersiveContent();
}

function updateImmersiveContent() {
  // 使用筛选后的集合
  const displayCollection = filteredCollection.length > 0 ? filteredCollection : collection;
  const item = displayCollection[currentIndex];
  const img = document.getElementById('immersive-img');
  const prompt = document.getElementById('immersive-prompt');
  const counterCurrent = document.getElementById('current-index');
  const counterTotal = document.getElementById('total-count');

  // 简单过渡
  img.style.opacity = 0;
  prompt.style.opacity = 0;

  setTimeout(() => {
    img.src = item.image;
    prompt.textContent = item.prompt;
    counterCurrent.textContent = currentIndex + 1;
    counterTotal.textContent = displayCollection.length;

    const fadeIn = () => {
      img.style.opacity = 1;
      prompt.style.opacity = 1;
    };

    if (img.complete) {
      fadeIn();
    } else {
      img.onload = fadeIn;
    }
  }, 200);
}

// 画廊函数
function renderGallery() {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;

  const currentUser = AuthService.getCurrentUser();
  const isAdmin = currentUser?.id === 'admin';

  // 使用筛选后的集合
  const displayCollection = filteredCollection;

  if (displayCollection.length === 0) {
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 4rem;">没有找到匹配的作品</p>';
    return;
  }

  grid.innerHTML = displayCollection.map((item, index) => {
    // 检查是否是当前用户的作品或管理员
    const isOwner = currentUser && item.artist === `Student_${currentUser.id}`;
    const canDelete = isAdmin || isOwner;
    const deleteBtn = canDelete ? `<button class="delete-btn" data-id="${item.id}" title="删除作品">🗑️</button>` : '';

    return `
    <article class="art-piece" style="transition-delay: ${index * 100}ms">
      <div class="image-container">
        <img src="${item.image}" alt="${item.title}" class="art-image" loading="lazy">
        ${deleteBtn}
      </div>
      <div class="art-info">
        <h3 class="art-title">${item.title}</h3>
        <span class="art-artist">${item.artist}</span>
      </div>
    </article>
  `;
  }).join('');

  // 渲染后附加其事件监听器
  const items = grid.querySelectorAll('.art-piece');
  items.forEach((item, index) => {
    // 点击图片容器打开模态框
    const imgContainer = item.querySelector('.image-container');
    const img = imgContainer.querySelector('.art-image');
    img.addEventListener('click', () => openModal(displayCollection[index]));

    // 删除按钮事件
    const deleteBtn = item.querySelector('.delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const artworkId = deleteBtn.dataset.id;
        await handleDeleteArtwork(artworkId);
      });
    }
  });
}

// Intersection Observer 淡入动画
function initObserve() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // 仅动画一次
      }
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

  const pieces = document.querySelectorAll('.art-piece');
  pieces.forEach(p => observer.observe(p));
}

function initModal() {
  // 常规模态框逻辑
  const modal = document.getElementById('modal');
  const closeBtn = document.querySelector('.close-modal');

  if (!modal) return;

  closeBtn.addEventListener('click', () => {
    modal.classList.remove('open');
    document.body.style.overflow = ''; // 恢复滚动
  });

  // 点击背景关闭
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.classList.contains('modal-inner')) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
}

function openModal(item) {
  const modal = document.getElementById('modal');
  const img = document.getElementById('modal-image');
  const title = document.getElementById('modal-title');
  const desc = document.getElementById('modal-desc');

  if (!modal) return;

  img.src = item.image;
  title.textContent = item.title;
  desc.textContent = item.desc;

  modal.classList.add('open');
  document.body.style.overflow = 'hidden'; // 锁定滚动
}

function initNavbar() {
  const navbar = document.querySelector('.navbar');
  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.view-section');

  if (!navbar) return;

  // View Switching Logic
  function switchView(viewId) {
    // 1. Update Tabs
    navItems.forEach(item => {
      if (item.dataset.view === viewId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // 2. Update Sections
    sections.forEach(section => {
      if (section.id === `view-${viewId}`) {
        section.style.display = 'block';
        // Small delay to allow display:block to apply before opacity transition if we added one
        requestAnimationFrame(() => {
          section.style.opacity = '1';
          section.style.transform = 'translateY(0)';
        });
      } else {
        section.style.opacity = '0';
        section.style.transform = 'translateY(10px)';
        setTimeout(() => {
          if (section.style.opacity === '0') section.style.display = 'none';
        }, 500); // Wait for transition
      }
    });

    // 3. Navbar Style handling
    if (viewId === 'home') {
      navbar.classList.remove('scrolled');
      // Only scroll effect on home if we kept the scroll within the view container? 
      // For now, Home is effectively 100vh, so no scroll needed usually.
    } else {
      navbar.classList.add('scrolled');
    }

    // Scroll to top when switching views
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Bind Click Events
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const viewId = item.dataset.view;
      switchView(viewId);
    });
  });

  // Handle CTA buttons that link to views
  document.querySelectorAll('.nav-trigger').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = btn.dataset.target;
      if (target) switchView(target);
    });
  });

  // Handle URL hash on load
  /*
  const hash = window.location.hash.slice(1);
  if (hash && ['home', 'gallery', 'about'].includes(hash)) {
      switchView(hash);
  }
  */
}

function initParallax() {
  const heroBg = document.querySelector('.hero-bg');
  if (!heroBg) return;

  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    // 背景以滚动速度的 40% 移动
    heroBg.style.transform = `translateY(${scrolled * 0.4}px)`;
  });
}

// initCursor 现在从 utils/cursor.js 导入

// 搜索功能
function initSearch() {
  const searchInput = document.getElementById('search-input');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    currentSearchTerm = e.target.value.toLowerCase().trim();
    applyFilters();
  });
}

// 管理员筛选功能
async function initAdminFilters() {
  const currentUser = AuthService.getCurrentUser();
  const adminFilters = document.getElementById('admin-filters');

  if (currentUser?.id === 'admin' && adminFilters) {
    adminFilters.classList.remove('hidden');

    // 加载学生列表
    try {
      const students = await fetch('/api/students').then(r => r.json());
      const filterSelect = document.getElementById('filter-by-student');

      students.forEach(studentId => {
        const option = document.createElement('option');
        option.value = studentId;
        option.textContent = `Student_${studentId}`;
        filterSelect.appendChild(option);
      });

      // 学生筛选事件
      filterSelect.addEventListener('change', (e) => {
        currentStudentFilter = e.target.value;
        applyFilters();
      });

      // 清除筛选按钮
      const clearBtn = document.getElementById('clear-filters');
      clearBtn.addEventListener('click', () => {
        currentSearchTerm = '';
        currentStudentFilter = '';
        document.getElementById('search-input').value = '';
        filterSelect.value = '';
        applyFilters();
      });
    } catch (err) {
      console.error('加载学生列表失败:', err);
    }
  }
}

// 应用所有筛选条件
function applyFilters() {
  filteredCollection = collection.filter(item => {
    // 搜索词筛选（匹配 prompt、title、artist）
    const matchesSearch = !currentSearchTerm ||
      (item.prompt && item.prompt.toLowerCase().includes(currentSearchTerm)) ||
      (item.title && item.title.toLowerCase().includes(currentSearchTerm)) ||
      (item.artist && item.artist.toLowerCase().includes(currentSearchTerm));

    // 学生筛选
    const matchesStudent = !currentStudentFilter ||
      item.artist === `Student_${currentStudentFilter}`;

    return matchesSearch && matchesStudent;
  });

  renderGallery();
  initObserve();
}

// 删除作品处理函数
async function handleDeleteArtwork(artworkId) {
  if (!confirm('确定要删除这件作品吗？此操作无法撤销。')) {
    return;
  }

  try {
    await GalleryService.deleteArtwork(artworkId);

    // 从集合中移除
    const index = collection.findIndex(item => item.id === artworkId);
    if (index !== -1) {
      collection.splice(index, 1);
    }

    // 重新应用筛选
    applyFilters();

    alert('作品已删除');
  } catch (err) {
    alert('删除失败: ' + err.message);
  }
}

// 更新导航栏状态
function updateNavbar() {
  const user = AuthService.getCurrentUser();
  const navUserBtn = document.getElementById('nav-user-btn');
  const navUploadBtn = document.getElementById('nav-upload-btn');

  if (user) {
    const typeLabels = {
      'student': '学生',
      'teacher': '教师',
      'admin': '管理员'
    };
    const typeLabel = typeLabels[user.userType] || '用户';
    navUserBtn.textContent = `${typeLabel}: ${user.name}`;

    // 显示上传按钮
    if (navUploadBtn) {
      navUploadBtn.style.display = 'inline-block';
    }
  } else {
    navUserBtn.textContent = '登录';

    // 隐藏上传按钮
    if (navUploadBtn) {
      navUploadBtn.style.display = 'none';
    }
  }
}

// 认证模态框逻辑（登录/注册）
function initAuth() {
  const authModal = document.getElementById('auth-modal');
  const closeBtn = document.querySelector('.close-auth');

  if (!authModal) return;

  // 关闭按钮
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      // 如果是强制登录模式，不允许关闭
      if (authModal.classList.contains('force-login')) {
        alert('请先登录或注册后才能使用系统');
        return;
      }
      authModal.classList.remove('active');
    });
  }

  // 标签页切换
  const tabs = authModal.querySelectorAll('.tab-btn');
  const contents = authModal.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.add('hidden'));

      tab.classList.add('active');
      const targetId = `tab-${tab.dataset.tab}`;
      const targetContent = document.getElementById(targetId);
      if (targetContent) {
        targetContent.classList.remove('hidden');
      }
    });
  });

  // 登录按钮
  const loginBtn = document.getElementById('do-login-btn');
  const loginInput = document.getElementById('login-id');
  const loginPassword = document.getElementById('login-password');

  if (loginBtn && loginInput && loginPassword) {
    loginBtn.addEventListener('click', async () => {
      const id = loginInput.value.trim();
      const password = loginPassword.value.trim();

      if (!id || !password) {
        alert('请输入账号和密码');
        return;
      }

      try {
        const user = await AuthService.login(id, password);

        // 移除强制登录状态
        authModal.classList.remove('force-login');

        alert(`欢迎, ${user.name}!`);

        // 关闭模态框
        authModal.classList.remove('active');

        // 更新导航栏
        updateNavbar();

        // 刷新画廊以显示用户相关内容
        await refreshGallery();
      } catch (e) {
        alert('登录失败: ' + e.message);
      }
    });
  }

  // 用户类型切换
  const registerType = document.getElementById('register-type');
  const registerIdLabel = document.getElementById('register-id-label');
  const registerIdInput = document.getElementById('register-id');

  if (registerType) {
    registerType.addEventListener('change', (e) => {
      if (e.target.value === 'student') {
        registerIdLabel.textContent = '学号（8位数字）';
        registerIdInput.placeholder = '例如：20250101';
      } else {
        registerIdLabel.textContent = '工号（7位数字）';
        registerIdInput.placeholder = '例如：2506049';
      }
    });
  }

  // 注册按钮
  const registerBtn = document.getElementById('do-register-btn');
  if (registerBtn) {
    registerBtn.addEventListener('click', async () => {
      const userType = document.getElementById('register-type').value;
      const userId = document.getElementById('register-id').value.trim();
      const name = document.getElementById('register-name').value.trim();
      const password = document.getElementById('register-password').value.trim();
      const passwordConfirm = document.getElementById('register-password-confirm').value.trim();

      if (!userId || !name || !password || !passwordConfirm) {
        alert('请填写完整信息');
        return;
      }

      // 使用统一的验证模块
      if (!validateUserId(userId, userType)) {
        alert(getValidationMessage('userId', userType));
        return;
      }

      if (!validatePassword(password)) {
        alert(getValidationMessage('password'));
        return;
      }

      if (password !== passwordConfirm) {
        alert('两次输入的密码不一致');
        return;
      }

      try {
        const user = await AuthService.register(userId, password, name, userType);

        // 移除强制登录状态
        authModal.classList.remove('force-login');

        alert(`注册成功！欢迎, ${user.name}!`);

        // 关闭模态框
        authModal.classList.remove('active');

        // 更新导航栏
        updateNavbar();

        // 刷新画廊以显示用户相关内容
        await refreshGallery();
      } catch (e) {
        alert('注册失败: ' + e.message);
      }
    });
  }

  // 跳转链接
  const gotoRegister = document.getElementById('goto-register');
  if (gotoRegister) {
    gotoRegister.addEventListener('click', (e) => {
      e.preventDefault();
      const registerTab = authModal.querySelector('[data-tab="register"]');
      if (registerTab) registerTab.click();
    });
  }

  const gotoLoginFromRegister = document.getElementById('goto-login-from-register');
  if (gotoLoginFromRegister) {
    gotoLoginFromRegister.addEventListener('click', (e) => {
      e.preventDefault();
      const loginTab = authModal.querySelector('[data-tab="login"]');
      if (loginTab) loginTab.click();
    });
  }
}

// 上传作品模态框逻辑
function initUpload() {
  const uploadModal = document.getElementById('upload-modal');
  const navUploadBtn = document.getElementById('nav-upload-btn');
  const closeBtn = document.querySelector('.close-upload');

  if (!uploadModal || !navUploadBtn) return;

  // 打开上传模态框
  navUploadBtn.addEventListener('click', () => {
    uploadModal.classList.add('active');
  });

  // 关闭按钮
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      uploadModal.classList.remove('active');
    });
  }

  // 上传表单逻辑
  initUploadForm();
}

// 个人中心模态框逻辑
function initProfile() {
  const profileModal = document.getElementById('profile-modal');
  const navUserBtn = document.getElementById('nav-user-btn');
  const closeBtn = document.querySelector('.close-profile');

  if (!profileModal || !navUserBtn) return;

  // 打开个人中心
  navUserBtn.addEventListener('click', () => {
    const user = AuthService.getCurrentUser();
    if (!user) {
      // 未登录，打开登录模态框
      const authModal = document.getElementById('auth-modal');
      if (authModal) {
        authModal.classList.add('active');
      }
      return;
    }

    // 已登录，打开个人中心
    profileModal.classList.add('active');
    loadProfileData();
  });

  // 关闭按钮
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      profileModal.classList.remove('active');
    });
  }

  // 更新姓名
  const updateNameBtn = document.getElementById('update-name-btn');
  if (updateNameBtn) {
    updateNameBtn.addEventListener('click', async () => {
      const user = AuthService.getCurrentUser();
      if (!user) return;

      const newName = document.getElementById('profile-new-name').value.trim();
      if (!newName) {
        alert('请输入新姓名');
        return;
      }

      try {
        const updatedUser = await AuthService.updateProfile(user.id, { name: newName });
        document.getElementById('profile-name').textContent = updatedUser.name;
        document.getElementById('profile-new-name').value = '';
        updateNavbar();
        alert('姓名更新成功！');
      } catch (e) {
        alert('更新失败: ' + e.message);
      }
    });
  }

  // 更新密码
  const updatePasswordBtn = document.getElementById('update-password-btn');
  if (updatePasswordBtn) {
    updatePasswordBtn.addEventListener('click', async () => {
      const user = AuthService.getCurrentUser();
      if (!user) return;

      const oldPassword = document.getElementById('profile-old-password').value.trim();
      const newPassword = document.getElementById('profile-new-password').value.trim();
      const confirmPassword = document.getElementById('profile-new-password-confirm').value.trim();

      if (!oldPassword || !newPassword || !confirmPassword) {
        alert('请填写完整信息');
        return;
      }

      if (newPassword !== confirmPassword) {
        alert('两次输入的新密码不一致');
        return;
      }

      if (newPassword.length < 6) {
        alert('密码至少需要6位');
        return;
      }

      try {
        await AuthService.updateProfile(user.id, {
          oldPassword: oldPassword,
          newPassword: newPassword
        });

        document.getElementById('profile-old-password').value = '';
        document.getElementById('profile-new-password').value = '';
        document.getElementById('profile-new-password-confirm').value = '';

        alert('密码更新成功！');
      } catch (e) {
        alert('更新失败: ' + e.message);
      }
    });
  }

  // 退出登录
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('确定要退出登录吗？')) {
        AuthService.logout();
      }
    });
  }
}

// 加载个人信息数据
function loadProfileData() {
  const user = AuthService.getCurrentUser();
  if (!user) return;

  // 显示用户信息
  document.getElementById('profile-id').textContent = user.id;
  document.getElementById('profile-name').textContent = user.name;

  const typeLabels = {
    'student': '学生',
    'teacher': '教师',
    'admin': '管理员'
  };
  document.getElementById('profile-type').textContent = typeLabels[user.userType] || user.userType;

  const joinedDate = new Date(user.joined).toLocaleDateString('zh-CN');
  document.getElementById('profile-joined').textContent = joinedDate;
}

function initUploadForm() {
  const fileInput = document.getElementById('art-file');
  const dropArea = document.getElementById('drop-area');
  const preview = document.getElementById('preview-img');
  const form = document.getElementById('upload-form');

  if (!dropArea || !fileInput) return;

  // 文件处理
  const handleFile = (file) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        preview.src = e.target.result;
        preview.style.display = 'block';
        dropArea.querySelector('.file-msg').style.display = 'none';
      };
      reader.readAsDataURL(file);
    }
  };

  dropArea.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

  dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropArea.classList.add('dragover');
  });
  dropArea.addEventListener('dragleave', () => dropArea.classList.remove('dragover'));
  dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dropArea.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    fileInput.files = e.dataTransfer.files; // 更新 input
    handleFile(file);
  });

  // 提交
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const file = fileInput.files[0];
      const title = document.getElementById('art-title').value;
      const prompt = document.getElementById('art-prompt').value;

      if (!file) {
        alert('请选择图片文件。');
        return;
      }

      const submitBtn = document.getElementById('submit-art-btn');
      submitBtn.textContent = '上传中...';
      submitBtn.disabled = true;

      try {
        const newArtwork = await GalleryService.uploadArtwork(file, title, prompt);

        // 动态添加到集合开头（最新的在前面）
        collection.unshift(newArtwork);

        // 重新应用筛选和渲染
        applyFilters();

        // 重置表单
        form.reset();
        preview.style.display = 'none';
        dropArea.querySelector('.file-msg').style.display = 'block';

        // 关闭模态框
        document.getElementById('upload-modal').classList.remove('active');

        // 显示成功消息
        alert('作品上传成功！');

        // 刷新画廊
        await refreshGallery();

        // 滚动到画廊区域查看新作品
        document.getElementById('gallery').scrollIntoView({ behavior: 'smooth' });

      } catch (err) {
        alert('上传失败: ' + err);
        submitBtn.textContent = '提交到展览';
        submitBtn.disabled = false;
      }
    });
  }
}
