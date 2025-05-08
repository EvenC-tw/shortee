import { Button, Col, Input, Row, Space, Typography, message } from 'antd';

import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import uuidBase62 from 'uuid62';

const { Paragraph, Text } = Typography;

function Home() {
  const [fetching, setFetching] = useState(false);
  const [shorteeing, setShorteeing] = useState(false);
  const [url, setUrl] = useState('');
  const [shortee, setShortee] = useState('');
  const [shortees, setShortees] = useState([]);
  const router = useRouter();

  function handleUrlInput({ target: { value } }) {
    try {
      let parsedUrl = new URL(value);

      setUrl(parsedUrl);
    } catch (error) {
      console.error('無效的 URL:', error);

      if (!value.startsWith(`http://`) && !value.startsWith(`https://`)) {
        try {
          let parsedUrl = new URL(`https://${value}`);
          setUrl(parsedUrl);
        } catch (httpsError) {
          try {
            let parsedUrl = new URL(`http://${value}`);
            setUrl(parsedUrl);
          } catch (httpError) {
            return false;
          }
        }
      } else {
        return false;
      }
    }
  }

  // 取得短網址列表 (目前未使用，但保留函數結構)
  async function fetchShortee() {
    setFetching(true);
    try {
      fetch('/api/shortee', {
        method: 'GET',
      })
        .then(async (res) => {
          const data = await res.json();
          setShortees(data);
        })
        .finally(() => {
          setFetching(false);
        });
    } catch (error) {
      setFetching(false);
      return false;
    }
  }

  // 新增短網址
  async function postShortee() {
    setShorteeing(true);
    setShortee('');

    if (!url || !url.href) {
      message.error('請輸入有效的 URL。');
      setShorteeing(false);
      return;
    }
    const validUrl = url.href;
    const tempShortee = uuidBase62.v4(validUrl).substring(0, 6);

    try {
      const response = await fetch('/api/shortee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin: validUrl,
          shortee: tempShortee,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '發生錯誤，請聯絡下方的 Email 通報錯誤。' }));
        throw new Error(errorData.message || `伺服器錯誤: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setShortee(tempShortee);
      } else {
        throw new Error(data.message || '建立短網址失敗。');
      }
    } catch (error) {
      console.error('postShortee 函數出錯:', error);
      message.error(error.message || '發生錯誤，請再試一次。');
    } finally {
      setShorteeing(false);
    }
  }

  return (
    <Row justify="center" style={{ width: '100%' }}>
      <Col xs={24} sm={20} md={16} lg={12} xl={10}>
        <Space style={{ width: '100%', display: 'flex' }}>
          <Input
            size="large"
            addonBefore={<Text>(https://)</Text>}
            placeholder="請在此輸入網址..."
            onInput={handleUrlInput}
            onKeyDown={({ key }) => key === 'Enter' && postShortee()}
            style={{ flexGrow: 1 }}
          />
          <Button size="large" type="primary" onClick={postShortee} loading={shorteeing}>
            Shortee!
          </Button>
        </Space>
        {shortee && (
          <Link href={`${location.origin}/${shortee}`} target="_blank" rel="noopener noreferrer">
            <Paragraph
              copyable={{
                tooltips: false,
              }}
              style={{ textAlign: 'center' }}
            >
              {`${location.origin}/${shortee}`}
            </Paragraph>
          </Link>
        )}
      </Col>
    </Row>
  );
}

export default Home;
