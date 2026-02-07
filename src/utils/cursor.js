/**
 * 自定义光标效果模块
 * 提供平滑的光标跟随和悬停效果
 */

export function initCursor() {
  const dot = document.querySelector('.cursor-dot');
  const outline = document.querySelector('.cursor-outline');

  // 仅当光标元素存在时继续（移动端可能通过 CSS 隐藏，但元素存在）
  if (!dot || !outline) return;

  // 鼠标移动
  window.addEventListener('mousemove', (e) => {
    const posX = e.clientX;
    const posY = e.clientY;

    // 点立即跟随
    dot.style.left = `${posX}px`;
    dot.style.top = `${posY}px`;

    // 轮廓线稍微延迟跟随
    outline.animate({
      left: `${posX}px`,
      top: `${posY}px`
    }, { duration: 500, fill: "forwards" });
  });

  // 悬停效果 - 通过委托实现
  document.addEventListener('mouseover', (e) => {
    const target = e.target;
    // 检查目标或其父级是否可交互
    if (target.matches('a, button, .image-container') ||
      target.closest('a') ||
      target.closest('button') ||
      target.closest('.image-container')) {
      document.body.classList.add('hovering');
    } else {
      document.body.classList.remove('hovering');
    }
  });

  // 处理鼠标离开可交互元素
  document.addEventListener('mouseout', (e) => {
    const target = e.target;
    // 如果离开的是可交互元素，移除 hovering 类
    if (target.matches('a, button, .image-container') ||
      target.closest('a') ||
      target.closest('button') ||
      target.closest('.image-container')) {
      // 检查鼠标是否移动到另一个可交互元素
      const relatedTarget = e.relatedTarget;
      if (!relatedTarget ||
          (!relatedTarget.matches('a, button, .image-container') &&
           !relatedTarget.closest('a') &&
           !relatedTarget.closest('button') &&
           !relatedTarget.closest('.image-container'))) {
        document.body.classList.remove('hovering');
      }
    }

    // 处理鼠标离开窗口
    if (e.relatedTarget === null) {
      document.body.classList.remove('hovering');
    }
  });
}
