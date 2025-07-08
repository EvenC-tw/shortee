import { Avatar, Button, Dropdown } from 'antd';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';

import { useAuth } from '../lib/auth/useAuth';

/**
 * 用戶認證介面組件
 * 顯示登入按鈕或用戶下拉選單
 */
export function UserAuth() {
  const { user, loading, isAuthenticated, login, logout } = useAuth();

  // 處理登出
  const handleLogout = async () => {
    const result = await logout();
    // 這裡可以加入 toast 通知
    console.log(result.message);
  };

  // 載入中狀態
  if (loading) {
    return <Avatar icon={<UserOutlined />} />;
  }

  // 已登入狀態
  if (isAuthenticated && user) {
    return (
      <Dropdown
        menu={{
          items: [
            {
              key: 'profile',
              label: `歡迎，${user.name}`,
              disabled: true,
            },
            {
              type: 'divider',
            },
            {
              key: 'logout',
              label: '登出',
              icon: <LogoutOutlined />,
              onClick: handleLogout,
            },
          ],
        }}
        placement="bottomRight"
      >
        <Avatar 
          style={{ cursor: 'pointer' }}
          icon={<UserOutlined />}
        />
      </Dropdown>
    );
  }

  // 未登入狀態
  return (
    <Button 
      type="primary" 
      onClick={login}
      style={{ 
        backgroundColor: '#00B900', 
        borderColor: '#00B900' 
      }}
    >
      使用 Line 登入
    </Button>
  );
} 