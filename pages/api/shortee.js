const { connectToDatabase } = require('../../lib/mongodb');
const ObjectId = require('mongodb').ObjectId;

export default async function handler(req, res) {
  // switch the methods
  const { method } = req;
  switch (method) {
    case 'GET': {
      return getShortee(req, res);
    }

    case 'POST': {
      return addShortee(req, res);
    }

    case 'PUT': {
      return updateShortee(req, res);
    }

    case 'DELETE': {
      return deleteShortee(req, res);
    }
    default: {
      return false;
    }
  }
}

async function getShortee(req, res) {
  const { query } = req;
  try {
    const { shortee } = query;
    // connect to the database
    const { db } = await connectToDatabase();
    // fetch the posts
    const result = await db.collection('urlMap').findOne({ shortee: shortee });
    // return the posts
    return res.json(result);
  } catch (error) {
    // return the error
    return res.json({
      message: new Error(error).message,
      success: false,
    });
  }
}

async function addShortee(req, res) {
  try {
    // connect to the database
    const { db } = await connectToDatabase();
    // add the shortee
    const result = await db.collection('urlMap').insertOne(JSON.parse(req.body));
    // return a message
    return res.json({
      message: 'Shortee added successfully',
      success: true,
    });
  } catch (error) {
    // return an error
    return res.json({
      message: new Error(error).message,
      success: false,
    });
  }
}
