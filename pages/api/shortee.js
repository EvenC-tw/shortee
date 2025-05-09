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
    return res.status(400).json({ message: 'Shortee parameter is required and must be a string.', success: false });
  }

  try {
    const data = await kv.get(shortee);
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
  const { origin, shortee } = req.body;

  if (!origin || typeof origin !== 'string' || !shortee || typeof shortee !== 'string') {
    console.warn('addShortee (KV): Missing or invalid origin or shortee in request body.');
    return res
      .status(400)
      .json({ message: 'Both origin URL and shortee code are required and must be strings.', success: false });
  }

  try {
    let parsedOriginUrl;
    try {
      parsedOriginUrl = new URL(origin);
      if (!isValidWebUrl(parsedOriginUrl)) {
        throw new Error('Invalid origin URL format or scheme according to server-side validation.');
      }
    } catch (urlError) {
      console.warn(`addShortee (KV): Invalid origin URL format: ${origin}. Error: ${urlError.message}`);
      return res.status(400).json({ message: `無效的原始網址格式: ${urlError.message}`, success: false });
    }

    // 移除 URL 片段（以 # 開頭的部分）以進行可達性檢查
    parsedOriginUrl.hash = '';
    const urlForValidation = parsedOriginUrl.href;

    console.log(`addShortee (KV): Checking reachability for: ${urlForValidation}`);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const response = await fetch(urlForValidation, {
        method: 'GET',
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok && response.status >= 400 && response.status !== 403 && response.status !== 405) {
        console.warn(
          `addShortee (KV): URL reachability check failed for ${urlForValidation} - Status: ${response.status}`
        );
        return res.status(400).json({
          message: `目標網址似乎無法訪問或不存在 (狀態碼: ${response.status})。請檢查網址是否正確。`,
          success: false,
        });
      }
      console.log(
        `addShortee (KV): URL reachability check successful for ${urlForValidation} - Status: ${response.status}`
      );
    } catch (fetchError) {
      console.warn(
        `addShortee (KV): URL reachability check threw an error for ${urlForValidation}: ${fetchError.name} - ${fetchError.message}`
      );
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
        success: false,
      });
    }

    console.log(`addShortee (KV): Attempting to set KV: key=${shortee}, value={ origin: ${origin} }`);
    try {
      await kv.set(shortee, { origin: origin });
      console.log(`addShortee (KV): KV.set successful for key: ${shortee}, stored origin: ${origin}`);
    } catch (kvError) {
      console.error(`addShortee (KV): Failed to set KV for key ${shortee}:`, kvError);
      return res.status(500).json({
        message: '儲存短網址時發生內部錯誤，請稍後再試。',
        success: false,
      });
    }

    return res.status(201).json({
      message: 'Shortee added successfully using Vercel KV',
      success: true,
      data: {
        shortee,
        origin: origin,
      },
    });
  } catch (error) {
    // Catchall for unexpected errors in addShortee function body
    console.error('Error in addShortee (KV) [Outer Try-Catch]:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred while adding shortee.';
    return res.status(500).json({
      message: errorMessage,
      success: false,
    });
  }
}

/**
 * Checks if the given URL object is a valid web URL (http or https)
 * with a TLD and not localhost.
 *
 * @param {URL} urlObject The URL object to validate.
 * @returns {boolean} True if the URL is valid, false otherwise.
 */
function isValidWebUrl(urlObject) {
  if (!(urlObject instanceof URL)) {
    // This case should ideally be caught by new URL() constructor failing first,
    // but as a safeguard for direct calls:
    console.warn('isValidWebUrl: Input is not a valid URL object.');
    return false;
  }
  const { protocol, hostname } = urlObject;
  if (protocol !== 'http:' && protocol !== 'https:') {
    // console.debug(`isValidWebUrl: Invalid protocol - ${protocol}`); // Debug level, can be noisy
    return false;
  }
  if (!hostname) {
    // console.debug(`isValidWebUrl: Missing hostname`);
    return false;
  }
  if (hostname === 'localhost' || !hostname.includes('.')) {
    // console.debug(`isValidWebUrl: Invalid hostname (missing TLD or localhost) - ${hostname}`);
    return false;
  }
  return true;
}
