import { ConfigProvider, Layout, Switch, Typography, theme } from 'antd';
import React, { useEffect, useState } from 'react';

import { AppProps } from 'next/app';
import Link from 'next/link';

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

function MyApp({ Component, pageProps }: AppProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem('appTheme');
    if (storedTheme) {
      setIsDarkMode(storedTheme === 'dark');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('appTheme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const layoutStyle: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  };

  const headerStyle: React.CSSProperties = {
    height: '80px',
    flexShrink: 0,
    display: 'flex',
    justifyContent: 'space-between',
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

  // 監聽系統主題變化
  useEffect(() => {
    const isBrowserDarkMode = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(isBrowserDarkMode.matches);

    const handleChange = (e) => {
      setIsDarkMode(e.matches);
    };

    isBrowserDarkMode.addEventListener('change', handleChange);
    return () => isBrowserDarkMode.removeEventListener('change', handleChange);
  }, []);

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? darkAlgorithm : defaultAlgorithm,
        token: {
          colorBgContainer: isDarkMode ? '#1f1f1f' : 'white',
          colorTextHeading: isDarkMode ? 'white' : 'black',
        },
        components: {
          Layout: {
            headerBg: isDarkMode ? '#001529' : 'white',
          },
        },
      }}
    >
      <Layout style={layoutStyle}>
        <Header style={headerStyle}>
          <Title style={{ margin: 0 }}>Let&apos;s Get Shortee!</Title>
          <Switch checked={isDarkMode} onChange={toggleTheme} />
        </Header>
        <Content style={contentStyle}>
          <Component {...pageProps} />
        </Content>
        <Footer style={footerStyle}>
          powered by <Link href="mailto:even@evenc.studio">Even</Link>
        </Footer>
      </Layout>
    </ConfigProvider>
  );
}

export default MyApp;
