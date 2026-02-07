/**
 * 模态框管理模块
 * 提供统一的模态框打开/关闭逻辑
 */

export class Modal {
  constructor(modalId) {
    this.modal = document.getElementById(modalId);
    this.closeBtn = this.modal?.querySelector('.close-modal, .close-upload');
  }

  open() {
    if (this.modal) {
      this.modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  close() {
    if (this.modal) {
      this.modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  init() {
    // 关闭按钮点击
    this.closeBtn?.addEventListener('click', () => this.close());

    // 点击背景关闭
    this.modal?.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });

    // ESC 键关闭
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal?.classList.contains('active')) {
        this.close();
      }
    });
  }
}
