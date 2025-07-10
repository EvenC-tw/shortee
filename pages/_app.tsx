import { App, Avatar, Button, ConfigProvider, Dropdown, Layout, Menu, Space, Typography, theme } from 'antd';
import { HistoryOutlined, LogoutOutlined, MenuOutlined, UserOutlined } from '@ant-design/icons';
import React, { useEffect, useState } from 'react';

import { AppProps } from 'next/app';
import Link from 'next/link';
import { createGlobalStyle } from 'styled-components';

const { Header, Content, Footer } = Layout;
const { Title, Paragraph } = Typography;

interface GlobalStyleProps {
  isDarkMode: boolean;
}

const GlobalStyle = createGlobalStyle<GlobalStyleProps>`
  html, body, #__next {
    height: 100%;
    margin: 0;
    padding: 0;
    background-color: ${(props) => (props.isDarkMode ? '#141414' : '#ffffff')};
    color: ${(props) => (props.isDarkMode ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)')};
  }

  a {
    color: ${(props) => (props.isDarkMode ? '#1677ff' : '#1890ff')};
  }
`;

function MyApp({ Component, pageProps }: AppProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem('appTheme');
    if (storedTheme) {
      setIsDarkMode(storedTheme === 'dark');
    }
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setIsDarkMode(mediaQuery.matches);
      const handleChange = (e) => setIsDarkMode(e.matches);
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('appTheme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    const checkScreenSize = () => setIsMobile(window.innerWidth <= 768);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const layoutStyle: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  };

  const headerStyle: React.CSSProperties = {
    minHeight: '5rem',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    padding: '0 24px',
  };

  const contentStyle: React.CSSProperties = {
    flexGrow: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '24px 48px',
  };

  const footerStyle: React.CSSProperties = {
    textAlign: 'center',
    flexShrink: 0,
  };

  const { darkAlgorithm, defaultAlgorithm } = theme;

  const appVersion = process.env.APP_VERSION;

  const menuItems = [
    {
      key: 'theme',
      icon: <span>{isDarkMode ? '☀️' : '🌙'}</span>,
      label: (
        <span onClick={toggleTheme}>{isDarkMode ? '切換為淺色模式' : '切換為深色模式'}</span>
      ),
    },
    {
      key: 'history',
      icon: <HistoryOutlined />,
      label: <span>歷史記錄</span>,
      // 可根據實際需求加上 onClick 或連結
    },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: <span>個人中心</span>,
      // 可根據登入狀態顯示登入/登出
    },
  ];

  return (
    <>
      <GlobalStyle isDarkMode={isDarkMode} />
      <ConfigProvider
        theme={{
          algorithm: isDarkMode ? darkAlgorithm : defaultAlgorithm,
          token: {
            colorBgContainer: isDarkMode ? '#1f1f1f' : 'white',
            colorText: isDarkMode ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)',
            colorTextHeading: isDarkMode ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.9)',
          },
          components: {
            Layout: {
              headerBg: isDarkMode ? '#1f1f1f' : 'white',
              bodyBg: isDarkMode ? '#141414' : '#f0f2f5',
            },
          },
        }}
      >
        <App>
          <Layout style={layoutStyle}>
            <Header style={headerStyle}>
              <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                <Title
                  style={{ margin: 0, flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  Shortee
                </Title>
                {!isMobile && (
                  <Button shape="circle" icon={<MenuOutlined />} onClick={() => setDrawerVisible(true)} />
                )}
              </Space>
            </Header>
            <Content style={contentStyle}>
              <Component {...pageProps} isDarkMode={isDarkMode} toggleTheme={toggleTheme} drawerVisible={drawerVisible} setDrawerVisible={setDrawerVisible} />
            </Content>
            <Footer style={footerStyle}>
              <Paragraph>
                寫信給 <Link href="mailto:even@evenc.studio">Even</Link> 打小報告
              </Paragraph>
              <Paragraph>
                {appVersion && (
                  <span style={{ marginLeft: '10px', fontSize: '0.8em', opacity: 0.7 }}>Version: {appVersion}</span>
                )}
              </Paragraph>
            </Footer>
          </Layout>
        </App>
      </ConfigProvider>
    </>
  );
}

export default MyApp;
