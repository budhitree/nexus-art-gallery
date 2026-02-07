/**
 * API 客户端模块
 * 统一的 API 调用和错误处理
 */

/**
 * API 错误类
 */
export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * API 客户端
 */
export class ApiClient {
  /**
   * 发送 HTTP 请求
   * @param {string} url - 请求URL
   * @param {Object} options - fetch选项
   * @returns {Promise<any>}
   */
  static async request(url, options = {}) {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      const data = await response.json();

      // 统一处理错误响应
      if (!response.ok) {
        throw new ApiError(
          data.error || data.message || 'Request failed',
          response.status,
          data
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(error.message, 0, null);
    }
  }

  /**
   * GET 请求
   */
  static get(url) {
    return this.request(url, { method: 'GET' });
  }

  /**
   * POST 请求
   */
  static post(url, body) {
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  /**
   * PUT 请求
   */
  static put(url, body) {
    return this.request(url, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  /**
   * DELETE 请求
   */
  static delete(url, body) {
    return this.request(url, {
      method: 'DELETE',
      body: body ? JSON.stringify(body) : undefined
    });
  }

  /**
   * 上传文件
   * @param {string} url - 上传URL
   * @param {FormData} formData - 表单数据
   * @returns {Promise<any>}
   */
  static async upload(url, formData) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData
        // 不设置 Content-Type，让浏览器自动设置 multipart/form-data
      });

      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(
          data.error || data.message || 'Upload failed',
          response.status,
          data
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(error.message, 0, null);
    }
  }
}
