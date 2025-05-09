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

    try {
      new URL(origin);
    } catch (urlError) {
      console.warn(`addShortee (KV): Invalid origin URL format: ${origin}`);
      return res.status(400).json({ message: 'Invalid origin URL format.' });
    }
    
    console.log(`addShortee (KV): Attempting to set KV: key=${shortee}, value={ origin: ${origin} }`);
    await kv.set(shortee, { origin: origin });

    console.log(`addShortee (KV): KV.set successful for key: ${shortee}`);

    return res.status(201).json({
      message: 'Shortee added successfully using Vercel KV',
      success: true,
      data: { shortee, origin },
    });
  } catch (error) {
    console.error('Error in addShortee (KV):', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred while adding shortee.';
    return res.status(500).json({
      message: errorMessage,
      success: false,
    });
  }
}
