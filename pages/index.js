import { App, Button, Col, Form, Input, Row, Space, Typography } from 'antd';

import Link from 'next/link';
import { useState } from 'react';
import uuidBase62 from 'uuid62';

const { Paragraph, Text } = Typography;

/**
 * 檢查給定的 URL 物件是否為有效的 Web URL (http 或 https)
 * 並且主機名稱包含 TLD (由點 . 表示) 且非 localhost。
 * @param {URL} urlObject - 要驗證的 URL 物件。
 * @returns {boolean} 如果有效則為 true，否則為 false。
 */
function isValidWebUrl(urlObject) {
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

function Home() {
  const { message: messageApi } = App.useApp();

  const [shorteeing, setShorteeing] = useState(false);
  const [url, setUrl] = useState(null);
  const [isUrlValid, setIsUrlValid] = useState(false);
  const [shortee, setShortee] = useState('');

  const [urlInput, setUrlInput] = useState('');
  const [validateStatus, setValidateStatus] = useState('');
  const [helpMessage, setHelpMessage] = useState('');

  function validateAndSetUrl(inputValue) {
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
      console.warn('初步驗證失敗:', trimmedValue, error.message);
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
          console.warn('添加 HTTPS 驗證失敗:', `https://${trimmedValue}`, httpsError.message);
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
            console.warn('添加 HTTP 驗證失敗:', `http://${trimmedValue}`, httpError.message);
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

  const handleInputChange = (e) => {
    const currentValue = e.target.value;
    setUrlInput(currentValue);
    validateAndSetUrl(currentValue);
  };

  async function postShortee() {
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
      messageApi.error(error.message || '建立短網址時發生預期外的錯誤，請稍後再試。');
    } finally {
      setShorteeing(false);
    }
  }

  return (
    <Row justify="center" style={{ width: '100%' }}>
      <Col xs={24} sm={20} md={16} lg={12} xl={10}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Form.Item 
            validateStatus={validateStatus} 
            help={helpMessage}
            style={{ marginBottom: 0 }}
          >
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
  );
}

export default Home;
