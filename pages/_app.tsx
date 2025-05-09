import { App, ConfigProvider, Layout, Switch, Typography, theme } from 'antd';
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

  const appVersion = process.env.APP_VERSION;

  return (
    <>
      <GlobalStyle isDarkMode={isDarkMode} />
      <ConfigProvider
        theme={{
          algorithm: isDarkMode ? darkAlgorithm : defaultAlgorithm,
          token: {
            colorBgContainer: isDarkMode ? '#1f1f1f' : '#ffffff',
            colorText: isDarkMode ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)',
            colorTextHeading: isDarkMode ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.9)',
          },
          components: {
            Layout: {
              headerBg: isDarkMode ? '#1f1f1f' : '#ffffff',
              bodyBg: isDarkMode ? '#141414' : '#f0f2f5',
            },
          },
        }}
      >
        <App>
          <Layout style={layoutStyle}>
            <Header style={headerStyle}>
              <Title style={{ margin: 0 }}>Let&apos;s Get Shortee!</Title>
              <Switch checkedChildren="🌙" unCheckedChildren="☀️" checked={isDarkMode} onChange={toggleTheme} />
            </Header>
            <Content style={contentStyle}>
              <Component {...pageProps} />
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
