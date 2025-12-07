// netlify/functions/get-banner.js
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  // Headers CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Gérer les requêtes OPTIONS (preflight)
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Initialiser Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );

    // Récupérer userId depuis les paramètres
    const userId = event.queryStringParameters?.userId;

    // Récupérer la bannière active
    const { data: banner, error: bannerError } = await supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (bannerError && bannerError.code !== 'PGRST116') {
      throw bannerError;
    }

    if (!banner) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ banner: null, userHasClosed: false })
      };
    }

    // Vérifier si l'utilisateur a fermé cette bannière
    let userHasClosed = false;
    if (userId) {
      const { data: dismissal } = await supabase
        .from('banner_dismissals')
        .select('id')
        .eq('banner_id', banner.id)
        .eq('user_id', userId)
        .single();

      userHasClosed = !!dismissal;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        banner: {
          id: banner.id,
          type: banner.type,
          title: banner.title,
          message: banner.message,
          date: banner.date,
          time: banner.time,
          link: banner.link,
          image: banner.image,
          created: banner.created_at
        },
        userHasClosed
      })
    };

  } catch (error) {
    console.error('Erreur get-banner:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Erreur serveur' })
    };
  }
};
