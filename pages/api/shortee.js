import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  const { method } = req;
  switch (method) {
    case 'GET': {
      return getShortee(req, res);
    }
    case 'POST': {
      return addShortee(req, res);
    }
    default: {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).end(`Method ${method} Not Allowed`);
    }
  }
}

async function getShortee(req, res) {
  console.log('getShortee API (KV) called with query:', req.query);
  
  const { shortee } = req.query;

  if (!shortee || typeof shortee !== 'string') {
    console.warn('getShortee (KV): Missing or invalid shortee parameter.');
    return res.status(400).json({ message: 'Shortee parameter is required and must be a string.' });
  }

  try {
    console.log(`getShortee (KV): Attempting to get key: ${shortee}`);
    const data = await kv.get(shortee); 
    console.log(`getShortee (KV): KV.get response for ${shortee}:`, data);

    if (data) {
      return res.status(200).json(data);
    } else {
      console.log(`getShortee (KV): Key ${shortee} not found.`);
      return res.status(404).json({ message: `Shortee '${shortee}' not found.`, success: false });
    }
  } catch (error) {
    console.error('Error in getShortee (KV):', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred while fetching shortee.';
    return res.status(500).json({
      message: errorMessage,
      success: false,
    });
  }
}

async function addShortee(req, res) {
  console.log('addShortee API (KV) called with body:', req.body);

  try {
    const { origin, shortee } = req.body;

    if (!origin || typeof origin !== 'string' || !shortee || typeof shortee !== 'string') {
      console.warn('addShortee (KV): Missing or invalid origin or shortee in request body.');
      return res.status(400).json({ message: 'Both origin URL and shortee code are required and must be strings.' });
    }

    let parsedOriginUrl;
    try {
      parsedOriginUrl = new URL(origin);
      if (!isValidWebUrl(parsedOriginUrl)) {
        throw new Error('Invalid origin URL format according to server-side validation.');
      }
    } catch (urlError) {
      console.warn(`addShortee (KV): Invalid origin URL format: ${origin}`, urlError.message);
      return res.status(400).json({ message: `無效的原始網址格式: ${urlError.message}` });
    }

    console.log(`addShortee (KV): Checking reachability for: ${parsedOriginUrl.href}`);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const response = await fetch(parsedOriginUrl.href, {
        method: 'HEAD',
        signal: controller.signal,
        redirect: 'follow'
      });
      
      clearTimeout(timeoutId);

      if (!response.ok && response.status >= 400 && response.status !== 403 && response.status !== 405) {
        console.warn(`addShortee (KV): URL reachability check failed for ${parsedOriginUrl.href} - Status: ${response.status}`);
        return res.status(400).json({ 
          message: `目標網址似乎無法訪問或不存在 (狀態碼: ${response.status})。請檢查網址是否正確。`,
          success: false 
        });
      }
      console.log(`addShortee (KV): URL reachability check successful for ${parsedOriginUrl.href} - Status: ${response.status}`);
    } catch (fetchError) {
      console.warn(`addShortee (KV): URL reachability check threw an error for ${parsedOriginUrl.href}:`, fetchError.name, fetchError.message);
      let userMessage = '無法驗證目標網址的可達性。請檢查網址是否正確，或稍後再試。';
      if (fetchError.name === 'AbortError') {
        userMessage = '驗證目標網址超時，它可能不存在或回應過慢。';
      } else if (fetchError.cause && fetchError.cause.code) {
        const nodeErrorCode = fetchError.cause.code;
        if (nodeErrorCode === 'ENOTFOUND' || nodeErrorCode === 'EAI_AGAIN') {
          userMessage = '目標網址的主機名稱無法解析，它可能不存在。';
        }
      }
      return res.status(400).json({ 
        message: userMessage,
        success: false 
      });
    }

    console.log(`addShortee (KV): Attempting to set KV: key=${shortee}, value={ origin: ${parsedOriginUrl.href} }`);
    await kv.set(shortee, { origin: parsedOriginUrl.href });

    console.log(`addShortee (KV): KV.set successful for key: ${shortee}`);

    return res.status(201).json({
      message: 'Shortee added successfully using Vercel KV',
      success: true,
      data: { shortee, origin: parsedOriginUrl.href },
    });
  } catch (error) {
    console.error('Error in addShortee (KV) [Outer Try-Catch]:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred while adding shortee.';
    return res.status(500).json({
      message: errorMessage,
      success: false,
    });
  }
}

function isValidWebUrl(urlObject) {
  if (!(urlObject instanceof URL)) return false;
  const { protocol, hostname } = urlObject;
  if (protocol !== 'http:' && protocol !== 'https:') return false;
  if (!hostname || hostname === 'localhost' || !hostname.includes('.')) return false;
  return true;
}
