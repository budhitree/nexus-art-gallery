/**
 * 用户认证服务
 * 处理登录、注册、用户信息管理
 */

import { ApiClient } from '../utils/apiClient.js';

const CURRENT_USER_KEY = 'nexus_current_user';

export const AuthService = {
  /**
   * 用户登录
   * @param {string} userId - 用户ID
   * @param {string} password - 密码
   * @returns {Promise<Object>} 用户信息
   */
  async login(userId, password) {
    try {
      const response = await ApiClient.post('/api/login', { userId, password });
      const user = response.data; // 提取 data 字段
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      return user;
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error.message || '登录失败');
    }
  },

  /**
   * 用户注册
   * @param {string} userId - 用户ID
   * @param {string} password - 密码
   * @param {string} name - 姓名
   * @param {string} userType - 用户类型 ('student' | 'teacher' | 'admin')
   * @returns {Promise<Object>} 用户信息
   */
  async register(userId, password, name, userType) {
    try {
      const response = await ApiClient.post('/api/register', {
        userId,
        password,
        name,
        userType
      });
      const user = response.data; // 提取 data 字段
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      return user;
    } catch (error) {
      console.error('Register error:', error);
      throw new Error(error.message || '注册失败');
    }
  },

  /**
   * 获取用户信息
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} 用户信息
   */
  async getUserProfile(userId) {
    try {
      const response = await ApiClient.get(`/api/user/${userId}`);
      return response.data; // 提取 data 字段
    } catch (error) {
      console.error('Get user profile error:', error);
      throw new Error('获取用户信息失败');
    }
  },

  /**
   * 更新用户信息
   * @param {string} userId - 用户ID
   * @param {Object} updates - 更新的字段
   * @returns {Promise<Object>} 更新后的用户信息
   */
  async updateProfile(userId, updates) {
    try {
      const currentUser = this.getCurrentUser();
      const response = await ApiClient.put(`/api/user/${userId}`, {
        ...updates,
        currentUserId: currentUser.id
      });
      const user = response.data; // 提取 data 字段
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      return user;
    } catch (error) {
      console.error('Update profile error:', error);
      throw new Error(error.message || '更新失败');
    }
  },

  /**
   * 用户登出
   */
  logout() {
    localStorage.removeItem(CURRENT_USER_KEY);
    window.location.reload();
  },

  /**
   * 获取当前登录用户
   * @returns {Object|null} 用户信息或null
   */
  getCurrentUser() {
    const userStr = localStorage.getItem(CURRENT_USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }
};
