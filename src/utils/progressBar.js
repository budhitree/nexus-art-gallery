/**
 * 进度条组件
 * 用于显示 AI 生成等长时间操作的进度
 */

export class ProgressBar {
  constructor(fillElementId) {
    this.fillElement = document.getElementById(fillElementId);
    this.progress = 0;
    this.interval = null;
  }

  /**
   * 开始进度条动画
   */
  start() {
    this.progress = 0;
    if (this.fillElement) {
      this.fillElement.style.width = '0%';
    }

    this.interval = setInterval(() => {
      // 前60%快速增长
      if (this.progress < 60) {
        this.progress += 1;
      }
      // 60-90%慢速增长
      else if (this.progress < 90) {
        this.progress += 0.5;
      }
      // 90%以上非常慢，等待实际完成
      else if (this.progress < 95) {
        this.progress += 0.1;
      }

      if (this.fillElement) {
        this.fillElement.style.width = `${Math.min(this.progress, 95)}%`;
      }
    }, 500);
  }

  /**
   * 完成进度条
   */
  complete() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.progress = 100;
    if (this.fillElement) {
      this.fillElement.style.width = '100%';
    }
  }

  /**
   * 重置进度条
   */
  reset() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.progress = 0;
    if (this.fillElement) {
      this.fillElement.style.width = '0%';
    }
  }

  /**
   * 设置特定进度
   * @param {number} percent - 进度百分比 (0-100)
   */
  setProgress(percent) {
    this.progress = Math.min(Math.max(percent, 0), 100);
    if (this.fillElement) {
      this.fillElement.style.width = `${this.progress}%`;
    }
  }
}
