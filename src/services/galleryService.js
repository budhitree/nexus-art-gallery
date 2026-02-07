/**
 * 画廊服务
 * 处理作品上传、删除、获取
 */

import { ApiClient } from '../utils/apiClient.js';
import { AuthService } from './authService.js';

export const GalleryService = {
  /**
   * 上传作品
   * @param {File} file - 图片文件
   * @param {string} title - 作品标题
   * @param {string} prompt - 提示词
   * @returns {Promise<Object>} 上传的作品信息
   */
  async uploadArtwork(file, title, prompt) {
    const user = AuthService.getCurrentUser();
    if (!user) throw new Error('未登录');

    const formData = new FormData();
    formData.append('image', file);
    formData.append('title', title);
    formData.append('prompt', prompt);
    formData.append('user', user.id);

    try {
      const response = await ApiClient.upload('/api/upload', formData);
      return response.data; // 提取 data 字段
    } catch (error) {
      console.error('Upload artwork error:', error);
      throw new Error(error.message || '上传失败');
    }
  },

  /**
   * 删除作品
   * @param {string} artworkId - 作品ID
   * @returns {Promise<Object>} 删除结果
   */
  async deleteArtwork(artworkId) {
    const user = AuthService.getCurrentUser();
    if (!user) throw new Error('未登录');

    try {
      const response = await ApiClient.delete(`/api/artwork/${artworkId}`, {
        user: user.id
      });
      return response.data; // 提取 data 字段
    } catch (error) {
      console.error('Delete artwork error:', error);
      throw new Error(error.message || '删除失败');
    }
  },

  /**
   * 获取合并的画廊集合（服务器作品 + 默认作品）
   * @param {Array} defaultCollection - 默认作品集合
   * @returns {Promise<Array>} 合并后的作品数组
   */
  async getCombinedCollection(defaultCollection) {
    try {
      const response = await ApiClient.get('/api/gallery');
      const serverArt = response.data; // 提取 data 字段
      // 服务器作品（最新）放在前面
      return [...serverArt, ...defaultCollection];
    } catch (error) {
      console.error('Gallery fetch error:', error);
      // 如果获取失败，返回默认集合
      return defaultCollection;
    }
  }
};
