// netlify/functions/delete-banner.js
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

function verifyAdminToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token requis');
  }
  const token = authHeader.substring(7);
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded.role !== 'admin') {
    throw new Error('Accès admin requis');
  }
  return decoded;
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'DELETE') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    verifyAdminToken(event.headers.authorization);

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );

    await supabase
      .from('banners')
      .update({ is_active: false })
      .eq('is_active', true);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: 'Bannière supprimée' })
    };

  } catch (error) {
    console.error('Erreur delete-banner:', error);

    if (error.message === 'Token requis' || error.message === 'Accès admin requis') {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: error.message })
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Erreur serveur' })
    };
  }
};
