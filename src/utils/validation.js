/**
 * 表单验证模块
 * 统一前后端的验证规则
 */

export const ValidationRules = {
  studentId: {
    pattern: /^\d{8}$/,
    message: '学号格式错误，应为8位数字'
  },
  teacherId: {
    pattern: /^\d{7}$/,
    message: '工号格式错误，应为7位数字'
  },
  password: {
    minLength: 6,
    message: '密码至少6位'
  },
  prompt: {
    minLength: 5,
    maxLength: 600,
    message: '提示词长度应在5-600字之间'
  }
};

/**
 * 验证用户ID格式
 * @param {string} userId - 用户ID
 * @param {string} userType - 用户类型 ('student' | 'teacher' | 'admin')
 * @returns {boolean}
 */
export function validateUserId(userId, userType) {
  if (userType === 'student') {
    return ValidationRules.studentId.pattern.test(userId);
  }
  if (userType === 'teacher') {
    return ValidationRules.teacherId.pattern.test(userId);
  }
  // admin 不需要特定格式验证
  return userId && userId.length > 0;
}

/**
 * 验证密码
 * @param {string} password - 密码
 * @returns {boolean}
 */
export function validatePassword(password) {
  return password && password.length >= ValidationRules.password.minLength;
}

/**
 * 验证提示词
 * @param {string} prompt - 提示词
 * @returns {boolean}
 */
export function validatePrompt(prompt) {
  const len = prompt.trim().length;
  return len >= ValidationRules.prompt.minLength &&
         len <= ValidationRules.prompt.maxLength;
}

/**
 * 获取验证错误消息
 * @param {string} field - 字段名
 * @param {string} userType - 用户类型（可选）
 * @returns {string}
 */
export function getValidationMessage(field, userType) {
  if (field === 'userId') {
    return userType === 'student'
      ? ValidationRules.studentId.message
      : ValidationRules.teacherId.message;
  }
  return ValidationRules[field]?.message || '输入格式错误';
}
