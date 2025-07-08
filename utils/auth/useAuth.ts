import { useCallback, useEffect, useState } from 'react';

import { API_ROUTES } from './constants';

/**
 * 認證 Hook
 * 管理用戶登入狀態和相關操作
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * 檢查用戶認證狀態
   */
  const checkAuthStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(API_ROUTES.ME);
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setError('認證檢查失敗');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 初始化認證狀態
   */
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  /**
   * Line 登入
   */
  const login = useCallback(() => {
    window.location.href = API_ROUTES.LINE_LOGIN;
  }, []);

  /**
   * 登出
   */
  const logout = useCallback(async () => {
    try {
      const response = await fetch(API_ROUTES.LOGOUT, { 
        method: 'POST' 
      });
      
      if (response.ok) {
        setUser(null);
        return { success: true, message: '已成功登出' };
      } else {
        throw new Error('登出失敗');
      }
    } catch (error) {
      console.error('Logout failed:', error);
      return { success: false, message: '登出失敗' };
    }
  }, []);

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    logout,
    refreshAuth: checkAuthStatus,
  };
} 