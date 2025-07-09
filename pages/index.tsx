import { App, Avatar, Button, Col, Dropdown, Form, Input, Row, Space, Typography } from 'antd';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';

import Head from 'next/head';
import Link from 'next/link';
import uuidBase62 from 'uuid62';

const { Paragraph, Text } = Typography;

interface User {
  name: string;
  [key: string]: any;
}

interface MetaData {
  type: string;
  url: string;
  title: string;
  description: string;
}

/**
 * 檢查給定的 URL 物件是否為有效的 Web URL (http 或 https)
 * 並且主機名稱包含 TLD (由點 . 表示) 且非 localhost。
 * @param {URL} urlObject - 要驗證的 URL 物件。
 * @returns {boolean} 如果有效則為 true，否則為 false。
 */
function isValidWebUrl(urlObject: URL): boolean {
  if (!(urlObject instanceof URL)) {
    console.warn('isValidWebUrl: 傳入的不是有效的 URL 物件');
    return false;
  }
  const { protocol, hostname } = urlObject;
  if (protocol !== 'http:' && protocol !== 'https:') {
    console.debug(`isValidWebUrl: 無效的協定 - ${protocol}`);
    return false;
  }
  if (!hostname) {
    console.debug(`isValidWebUrl: 缺少主機名稱`);
    return false;
  }
  if (hostname === 'localhost' || !hostname.includes('.')) {
    console.debug(`isValidWebUrl: 主機名稱無效 (缺少 TLD 或為 localhost) - ${hostname}`);
    return false;
  }
  return true;
}

function Home(): JSX.Element {
  const { message: messageApi } = App.useApp();

  const [shorteeing, setShorteeing] = useState<boolean>(false);
  const [url, setUrl] = useState<URL | null>(null);
  const [isUrlValid, setIsUrlValid] = useState<boolean>(false);
  const [shortee, setShortee] = useState<string>('');

  const [urlInput, setUrlInput] = useState<string>('');
  const [validateStatus, setValidateStatus] = useState<'' | 'validating' | 'success' | 'error' | 'warning'>('');
  const [helpMessage, setHelpMessage] = useState<string>('');

  // 使用者狀態
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // 檢查使用者登入狀態
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async (): Promise<void> => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLineLogin = (): void => {
    window.location.href = '/api/auth/line/login';
  };

  const handleLogout = async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      messageApi.success('已成功登出');
    } catch (error) {
      console.error('Logout failed:', error);
      messageApi.error('登出失敗');
    }
  };

  const meta: MetaData = {
    type: 'website',
    url: 'https://shortee.evenc.studio/',
    title: 'Shortee - 您的縮網址小幫手',
    description: '輕鬆產生簡短、易於分享的網址。由 evenc.studio 提供。',
  };

  function validateAndSetUrl(inputValue: string): void {
    const trimmedValue = inputValue.trim();

    if (!trimmedValue) {
      setUrl(null);
      setIsUrlValid(false);
      setValidateStatus('');
      setHelpMessage('');
      return;
    }

    setValidateStatus('validating');
    setHelpMessage('正在驗證網址...');
    setIsUrlValid(false);

    try {
      const parsedUrl = new URL(trimmedValue);
      if (!isValidWebUrl(parsedUrl)) {
        throw new Error('網址格式不正確或協定無效。');
      }
      setUrl(parsedUrl);
      setIsUrlValid(true);
      setValidateStatus('success');
      setHelpMessage('合法網址格式');
      console.log('有效 URL (直接解析):', parsedUrl.href);
    } catch (error) {
      console.warn('初步驗證失敗:', trimmedValue, (error as Error).message);
      if (!trimmedValue.toLowerCase().startsWith('http://') && !trimmedValue.toLowerCase().startsWith('https://')) {
        setHelpMessage('嘗試加上 https:// 進行驗證...');
        try {
          const httpsUrlString = `https://${trimmedValue}`;
          const parsedHttpsUrl = new URL(httpsUrlString);
          if (!isValidWebUrl(parsedHttpsUrl)) {
            throw new Error('使用 https 時，網址格式不正確或協定無效。');
          }
          setUrl(parsedHttpsUrl);
          setIsUrlValid(true);
          setValidateStatus('success');
          setHelpMessage('合法網址格式 (自動套用 https)');
          console.log('有效 URL (添加 https):', parsedHttpsUrl.href);
        } catch (httpsError) {
          console.warn('添加 HTTPS 驗證失敗:', `https://${trimmedValue}`, (httpsError as Error).message);
          setHelpMessage('嘗試加上 http:// 進行驗證...');
          try {
            const httpUrlString = `http://${trimmedValue}`;
            const parsedHttpUrl = new URL(httpUrlString);
            if (!isValidWebUrl(parsedHttpUrl)) {
              throw new Error('使用 http 時，網址格式不正確或協定無效。');
            }
            setUrl(parsedHttpUrl);
            setIsUrlValid(true);
            setValidateStatus('success');
            setHelpMessage('合法網址格式 (自動套用 http)');
            console.log('有效 URL (添加 http):', parsedHttpUrl.href);
          } catch (httpError) {
            console.warn('添加 HTTP 驗證失敗:', `http://${trimmedValue}`, (httpError as Error).message);
            setUrl(null);
            setIsUrlValid(false);
            setValidateStatus('error');
            setHelpMessage('無法識別為有效網址，請檢查輸入 (例如：google.com)。');
          }
        }
      } else {
        console.warn('包含協定的網址格式錯誤:', trimmedValue);
        setUrl(null);
        setIsUrlValid(false);
        setValidateStatus('error');
        setHelpMessage('網址格式錯誤，即使已包含協定。');
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const currentValue = e.target.value;
    setUrlInput(currentValue);
    validateAndSetUrl(currentValue);
  };

  async function postShortee(): Promise<void> {
    setShorteeing(true);
    setShortee('');

    if (!isUrlValid || !url || !url.href) {
      messageApi.error('請先輸入一個有效的網址。');
      setShorteeing(false);
      return;
    }

    const originUrl = url.href;
    const tempShorteeCode = uuidBase62.v4(originUrl).substring(0, 6);

    try {
      const response = await fetch('/api/shortee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin: originUrl,
          shortee: tempShorteeCode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '處理請求時發生未知網路錯誤。' }));
        messageApi.error(errorData.message || `伺服器錯誤，狀態碼: ${response.status}`);
        setShorteeing(false);
        return;
      }

      setShortee(tempShorteeCode);
      messageApi.success('短網址已成功產生！');
    } catch (error) {
      console.error('postShortee 函數處理錯誤:', error);
      messageApi.error((error as Error).message || '建立短網址時發生預期外的錯誤，請稍後再試。');
    } finally {
      setShorteeing(false);
    }
  }

  return (
    <>
      <Head>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={meta.url} />
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        {/* <meta property="og:image" content="https://shortee.evenc.studio/og-image.png" /> */}
        {/* 請替換成您的圖片網址 */}

        {/* X */}
        <meta property="x:card" content="summary_large_image" />
        <meta property="x:url" content={meta.url} />
        <meta property="x:title" content={meta.title} />
        <meta property="x:description" content={meta.description} />
        {/* <meta property="x:image" content="https://shortee.evenc.studio/x-image.png" /> */}
        {/* 請替換成您的圖片網址 */}
      </Head>
      <Row justify="center" style={{ width: '100%' }}>
        <Col xs={24} sm={20} md={16} lg={12} xl={10}>
          {/* 使用者狀態區域 */}
          <Row justify="end" style={{ marginBottom: 16 }}>
            {!loading && (
              user ? (
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
              ) : (
                <Button 
                  type="primary" 
                  onClick={handleLineLogin}
                  style={{ backgroundColor: '#00B900', borderColor: '#00B900' }}
                >
                  使用 Line 登入
                </Button>
              )
            )}
          </Row>
          
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Form.Item validateStatus={validateStatus} help={helpMessage} style={{ marginBottom: 0 }}>
              <Input
                size="large"
                addonBefore={<Text>(https://)</Text>}
                placeholder="請在此輸入網址..."
                value={urlInput}
                onChange={handleInputChange}
                onKeyDown={({ key }) => key === 'Enter' && isUrlValid && !shorteeing && postShortee()}
                style={{ flexGrow: 1 }}
              />
            </Form.Item>
            <Button
              size="large"
              type="primary"
              onClick={postShortee}
              loading={shorteeing}
              disabled={!isUrlValid || shorteeing}
              style={{ width: '100%' }}
            >
              Shortee!
            </Button>

            {shortee && (
              <Link
                href={`${location.origin}/${shortee}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'block', width: '100%' }}
              >
                <Paragraph
                  copyable={{
                    text: `${location.origin}/${shortee}`,
                    tooltips: '點擊複製網址',
                  }}
                  style={{ textAlign: 'center', margin: 0 }}
                >
                  {`${location.origin}/${shortee}`}
                </Paragraph>
              </Link>
            )}
          </Space>
        </Col>
      </Row>
    </>
  );
}

export default Home; 