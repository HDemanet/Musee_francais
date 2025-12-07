// netlify/functions/reopen-banner.js
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

  if (event.httpMethod !== 'POST') {
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

    // Récupérer la bannière active
    const { data: banner } = await supabase
      .from('banners')
      .select('id')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (banner) {
      // Supprimer toutes les fermetures de cette bannière
      await supabase
        .from('banner_dismissals')
        .delete()
        .eq('banner_id', banner.id);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: 'Bannière réactivée' })
    };

  } catch (error) {
    console.error('Erreur reopen-banner:', error);

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
