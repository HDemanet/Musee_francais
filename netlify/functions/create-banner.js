
// netlify/functions/create-banner.js
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

// Vérifier le token admin
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
    // Vérifier authentification
    verifyAdminToken(event.headers.authorization);

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );

    const { type, title, message, date, time, link, image } = JSON.parse(event.body);

    if (!title || !message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Titre et message requis' })
      };
    }

    // Désactiver toutes les bannières existantes
    await supabase
      .from('banners')
      .update({ is_active: false })
      .eq('is_active', true);

    // Créer la nouvelle bannière
    const { data, error } = await supabase
      .from('banners')
      .insert({
        type: type || 'event',
        title,
        message,
        date: date || null,
        time: time || null,
        link: link || null,
        image: image || null,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        bannerId: data.id,
        message: 'Bannière créée avec succès'
      })
    };

  } catch (error) {
    console.error('Erreur create-banner:', error);

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
