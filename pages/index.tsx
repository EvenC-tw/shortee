import { App, Avatar, Badge, Button, Card, Col, Drawer, Form, Input, List, Row, Space, Switch, Tabs, Tag, Typography } from 'antd';
import { EyeOutlined, HistoryOutlined, HomeOutlined, LinkOutlined, LogoutOutlined, MenuOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons';
import { useCallback, useEffect, useState } from 'react';

import Head from 'next/head';
import Link from 'next/link';
import dayjs from 'dayjs';
import uuidBase62 from 'uuid62';

const { Paragraph, Text, Title } = Typography;
const { TabPane } = Tabs;

interface User {
  name: string;
  [key: string]: any;
}

interface ShorteeHistory {
  shorteeCode: string;
  origin: string;
  title?: string;
  createdAt: Date;
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

function Home({ isDarkMode, toggleTheme, drawerVisible, setDrawerVisible }): JSX.Element {
  const { message: messageApi } = App.useApp();

  const [shorteeing, setShorteeing] = useState<boolean>(false);
  const [url, setUrl] = useState<URL | null>(null);
  const [isUrlValid, setIsUrlValid] = useState<boolean>(false);
  const [shortee, setShortee] = useState<string>('');

  const [urlInput, setUrlInput] = useState<string>('');
  const [titleInput, setTitleInput] = useState<string>('');
  const [validateStatus, setValidateStatus] = useState<'' | 'validating' | 'success' | 'error' | 'warning'>('');
  const [helpMessage, setHelpMessage] = useState<string>('');

  // 使用者狀態
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [history, setHistory] = useState<ShorteeHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // UI 狀態
  const [activeTab, setActiveTab] = useState<string>('home');
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [showOriginIndex, setShowOriginIndex] = useState<number | null>(null);

  // 檢查螢幕尺寸
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const loadHistory = useCallback(async (): Promise<void> => {
    if (!user) return;
    
    setLoadingHistory(true);
    try {
      const response = await fetch('/api/shortee/history');
      if (response.ok) {
        const data = await response.json();
        setHistory(data.shortees);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
      messageApi.error('載入歷史記錄失敗');
    } finally {
      setLoadingHistory(false);
    }
  }, [user, messageApi]);

  // 檢查使用者登入狀態
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // 當使用者登入狀態改變時，載入歷史記錄
  useEffect(() => {
    if (user) {
      loadHistory();
    } else {
      setHistory([]);
    }
  }, [user, loadHistory]);

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
      if (isMobile) {
        setActiveTab('home');
      }
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
          title: titleInput.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '處理請求時發生未知網路錯誤。' }));
        messageApi.error(errorData.message || `伺服器錯誤，狀態碼: ${response.status}`);
        setShorteeing(false);
        return;
      }

      setShortee(tempShorteeCode);
      setTitleInput('');
      messageApi.success('短網址已成功產生！');
      
      // 如果使用者已登入，重新載入歷史記錄
      if (user) {
        loadHistory();
      }
    } catch (error) {
      console.error('postShortee 函數處理錯誤:', error);
      messageApi.error((error as Error).message || '建立短網址時發生預期外的錯誤，請稍後再試。');
    } finally {
      setShorteeing(false);
    }
  }

  const formatDate = (dateString: string | Date): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 1. 複製短網址功能（共用）
  function copyShortUrl(shortUrl: string) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(shortUrl)
        .then(() => messageApi.success('短網址已複製'))
        .catch(() => fallbackCopy(shortUrl));
    } else {
      fallbackCopy(shortUrl);
    }
  }
  function fallbackCopy(text: string) {
    try {
      const input = document.createElement('input');
      input.value = text;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      messageApi.success('短網址已複製');
    } catch {
      messageApi.error('無法複製，請手動選取');
    }
  }

  // 1. 歷史記錄分組
  function groupHistoryByDate(history: ShorteeHistory[]) {
    const groups: { [key: string]: ShorteeHistory[] } = {};
    history.forEach(item => {
      const d = dayjs(item.createdAt);
      let label = d.isSame(dayjs(), 'day') ? 'Today'
        : d.isSame(dayjs().subtract(1, 'day'), 'day') ? 'Yesterday'
        : d.format('YYYY/MM/DD');
      if (!groups[label]) groups[label] = [];
      groups[label].push(item);
    });
    // 依照日期由近到遠排序
    const sorted = Object.entries(groups).sort((a, b) => {
      const getDate = (l: string) => l === 'Today' ? dayjs() : l === 'Yesterday' ? dayjs().subtract(1, 'day') : dayjs(l, 'YYYY/MM/DD');
      return getDate(b[0]).valueOf() - getDate(a[0]).valueOf();
    });
    return sorted;
  }

  // 2. 桌面版滑出介面內容
  const DesktopDrawerContent = ({ isDarkMode, toggleTheme }) => (
    <div style={{ padding: '20px 0' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 主題切換 */}
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <Button
            type="default"
            icon={<span>{isDarkMode ? '☀️' : '🌙'}</span>}
            onClick={toggleTheme}
          >
            {isDarkMode ? '切換為淺色模式' : '切換為深色模式'}
          </Button>
        </div>
        {/* 使用者資訊 */}
        {user ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <Avatar size={64} icon={<UserOutlined />} />
            <div style={{ marginTop: 12 }}>
              <Text strong>{user.name}</Text>
            </div>
            <Button 
              type="text" 
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              style={{ marginTop: 8 }}
            >
              登出
            </Button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <Button 
              type="primary" 
              size="large"
              onClick={handleLineLogin}
              style={{ backgroundColor: '#00B900', borderColor: '#00B900' }}
            >
              使用 Line 登入
            </Button>
          </div>
        )}

        {/* 歷史記錄 */}
        {user && (
          <div>
            <Title level={4} style={{ marginBottom: 16 }}>
              <HistoryOutlined /> 歷史記錄
            </Title>
            <Card loading={loadingHistory} style={{ maxHeight: '60vh', overflow: 'auto' }}>
              {history.length > 0 ? (
                <List
                  dataSource={groupHistoryByDate(history)}
                  renderItem={([label, items]) => (
                    <>
                      {/* 將分組標題區塊改為分隔線中間顯示 */}
                      <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0 4px' }}>
                        <div style={{ flex: 1, height: 1, background: isDarkMode ? '#333' : '#eee' }} />
                        <span style={{ margin: '0 12px', color: '#888', fontWeight: 600, fontSize: 15 }}>{label}</span>
                        <div style={{ flex: 1, height: 1, background: isDarkMode ? '#333' : '#eee' }} />
                      </div>
                      {items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((item, index) => (
                        <List.Item key={item.shorteeCode}>
                          <div style={{ width: '100%' }}>
                            {/* 第一行：標題、建立時間、複製短網址 */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <span style={{ fontWeight: 500, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title || '未命名'}</span>
                                <span style={{ color: '#888', fontSize: 12, marginLeft: 8 }}>{formatDate(item.createdAt)}</span>
                              </div>
                              <Button
                                type="text"
                                icon={<LinkOutlined />}
                                size="small"
                                onClick={() => copyShortUrl(`${location.origin}/${item.shorteeCode}`)}
                                style={{ marginLeft: 8 }}
                              />
                            </div>
                            {/* 第二行：顯示完整網址按鈕與展開區塊 */}
                            <div style={{ display: 'flex', alignItems: 'center', marginTop: 4 }}>
                              <Button
                                type="text"
                                icon={<EyeOutlined />}
                                size="small"
                                onClick={() => setShowOriginIndex(showOriginIndex === index ? null : index)}
                              >
                                {showOriginIndex === index ? '隱藏網址' : '顯示完整網址'}
                              </Button>
                            </div>
                            {showOriginIndex === index && (
                              <div style={{
                                overflowX: 'auto',
                                wordBreak: 'break-all',
                                whiteSpace: 'pre-line',
                                fontSize: 12,
                                color: '#888',
                                border: '1px solid #eee',
                                borderRadius: 4,
                                padding: '4px 8px',
                                marginTop: 2,
                              }}>
                                {item.origin}
                              </div>
                            )}
                          </div>
                        </List.Item>
                      ))}
                    </>
                  )}
                />
              ) : (
                <div style={{ textAlign: 'center', color: '#999' }}>
                  還沒有建立任何短網址
                </div>
              )}
            </Card>
          </div>
        )}
      </Space>
    </div>
  );

  // 2. 手機版底部導航
  const MobileBottomNav = () => (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: isDarkMode ? '#1f1f1f' : '#fff',
      borderTop: isDarkMode ? '1px solid #333' : '1px solid #f0f0f0',
      padding: '8px 0',
      zIndex: 1000,
    }}>
      <Row justify="space-around" align="middle">
        <Col span={8} style={{ textAlign: 'center' }}>
          <Button
            type="text"
            icon={<HomeOutlined style={{ fontSize: 24 }} />}
            onClick={() => setActiveTab('home')}
            style={{ color: activeTab === 'home' ? '#1890ff' : '#666', height: 'auto', padding: '8px 0' }}
          />
        </Col>
        <Col span={8} style={{ textAlign: 'center' }}>
          <Button
            type="text"
            icon={<HistoryOutlined style={{ fontSize: 24 }} />}
            onClick={() => setActiveTab('history')}
            style={{ color: activeTab === 'history' ? '#1890ff' : '#666', height: 'auto', padding: '8px 0' }}
          />
        </Col>
        <Col span={8} style={{ textAlign: 'center' }}>
          <Button
            type="text"
            icon={user ? <UserOutlined style={{ fontSize: 24 }} /> : <SettingOutlined style={{ fontSize: 24 }} />}
            onClick={() => setActiveTab('profile')}
            style={{ color: activeTab === 'profile' ? '#1890ff' : '#666', height: 'auto', padding: '8px 0' }}
          />
        </Col>
      </Row>
    </div>
  );

  // 3. 手機版內容區域
  const MobileContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div style={{ paddingBottom: '80px' }}>
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
              
              {/* 標題輸入欄位 - 僅在登入時顯示 */}
              {user && (
                <Input
                  placeholder="為這個短網址添加標題 (選填)"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onKeyDown={({ key }) => key === 'Enter' && isUrlValid && !shorteeing && postShortee()}
                />
              )}
              
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
          </div>
        );
      
      case 'history':
        return (
          <div style={{ paddingBottom: '80px' }}>
            {user ? (
              <Card
                title={
                  <Space>
                    <HistoryOutlined />
                    <span>歷史記錄</span>
                    <span style={{ color: '#888', fontSize: 13 }}>({history.length})</span>
                  </Space>
                }
                loading={loadingHistory}
              >
                {history.length > 0 ? (
                  <List
                    dataSource={groupHistoryByDate(history)}
                    renderItem={([label, items]) => (
                      <>
                        {/* 將分組標題區塊改為分隔線中間顯示 */}
                        <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0 4px' }}>
                          <div style={{ flex: 1, height: 1, background: isDarkMode ? '#333' : '#eee' }} />
                          <span style={{ margin: '0 12px', color: '#888', fontWeight: 600, fontSize: 15 }}>{label}</span>
                          <div style={{ flex: 1, height: 1, background: isDarkMode ? '#333' : '#eee' }} />
                        </div>
                        {items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((item, index) => (
                          <List.Item key={item.shorteeCode}>
                            <div style={{ width: '100%' }}>
                              {/* 第一行：標題、建立時間、複製短網址 */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <span style={{ fontWeight: 500, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title || '未命名'}</span>
                                  <span style={{ color: '#888', fontSize: 12, marginLeft: 8 }}>{formatDate(item.createdAt)}</span>
                                </div>
                                <Button
                                  type="text"
                                  icon={<LinkOutlined />}
                                  size="small"
                                  onClick={() => copyShortUrl(`${location.origin}/${item.shorteeCode}`)}
                                  style={{ marginLeft: 8 }}
                                />
                              </div>
                              {/* 第二行：顯示完整網址按鈕與展開區塊 */}
                              <div style={{ display: 'flex', alignItems: 'center', marginTop: 4 }}>
                                <Button
                                  type="text"
                                  icon={<EyeOutlined />}
                                  size="small"
                                  onClick={() => setShowOriginIndex(showOriginIndex === index ? null : index)}
                                >
                                  {showOriginIndex === index ? '隱藏網址' : '顯示完整網址'}
                                </Button>
                              </div>
                              {showOriginIndex === index && (
                                <div style={{
                                  overflowX: 'auto',
                                  wordBreak: 'break-all',
                                  whiteSpace: 'pre-line',
                                  fontSize: 12,
                                  color: '#888',
                                  border: '1px solid #eee',
                                  borderRadius: 4,
                                  padding: '4px 8px',
                                  marginTop: 2,
                                }}>
                                  {item.origin}
                                </div>
                              )}
                            </div>
                          </List.Item>
                        ))}
                      </>
                    )}
                  />
                ) : (
                  <div style={{ textAlign: 'center', color: '#999' }}>
                    還沒有建立任何短網址
                  </div>
                )}
              </Card>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <UserOutlined style={{ fontSize: '48px', color: '#ccc', marginBottom: 16 }} />
                <Title level={4}>請先登入</Title>
                <Text type="secondary">登入後即可查看您的歷史記錄</Text>
                <div style={{ marginTop: 16 }}>
                  <Button 
                    type="primary" 
                    onClick={handleLineLogin}
                    style={{ backgroundColor: '#00B900', borderColor: '#00B900' }}
                  >
                    使用 Line 登入
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      
      case 'profile':
        return (
          <div style={{ paddingBottom: '80px' }}>
            {activeTab === 'profile' && (
              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                <Switch
                  checked={isDarkMode}
                  onChange={toggleTheme}
                  checkedChildren={<span>🌙</span>}
                  unCheckedChildren={<span>☀️</span>}
                  style={{ background: isDarkMode ? '#333' : '#eee' }}
                />
              </div>
            )}
            {user ? (
              <Card>
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <Avatar size={80} icon={<UserOutlined />} />
                  <div style={{ marginTop: 16 }}>
                    <Title level={3}>{user.name}</Title>
                  </div>
                  <Button 
                    type="primary" 
                    danger
                    icon={<LogoutOutlined />}
                    onClick={handleLogout}
                    style={{ marginTop: 16 }}
                  >
                    登出
                  </Button>
                </div>
              </Card>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <UserOutlined style={{ fontSize: '48px', color: '#ccc', marginBottom: 16 }} />
                <Title level={4}>歡迎使用 Shortee</Title>
                <Text type="secondary">登入後可享受更多功能</Text>
                <div style={{ marginTop: 16 }}>
                  <Button 
                    type="primary" 
                    size="large"
                    onClick={handleLineLogin}
                    style={{ backgroundColor: '#00B900', borderColor: '#00B900' }}
                  >
                    使用 Line 登入
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

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

      {/* 桌面版 */}
      {!isMobile && (
        <>
          <Row justify="center" style={{ width: '100%' }}>
            <Col xs={24} sm={20} md={16} lg={12} xl={10}>
              {/* 使用者狀態區域 */}
              
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
                
                {/* 標題輸入欄位 - 僅在登入時顯示 */}
                {user && (
                  <Input
                    placeholder="為這個短網址添加標題 (選填)"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    onKeyDown={({ key }) => key === 'Enter' && isUrlValid && !shorteeing && postShortee()}
                  />
                )}
                
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

          {/* 桌面版滑出介面 */}
          <Drawer
            title="個人中心"
            placement="right"
            onClose={() => setDrawerVisible(false)}
            open={drawerVisible}
            width={320}
          >
            <DesktopDrawerContent isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
          </Drawer>
        </>
      )}

      {/* 手機版 */}
      {isMobile && (
        <>
          <div style={{ paddingBottom: '80px' }}>
            <Row justify="center" style={{ width: '100%' }}>
              <Col span={24} style={{ padding: '0 16px' }}>
                <MobileContent />
              </Col>
            </Row>
          </div>
          <MobileBottomNav />
        </>
      )}
    </>
  );
}

export default Home; 