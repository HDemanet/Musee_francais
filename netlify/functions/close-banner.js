
// netlify/functions/close-banner.js
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
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
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );

    const { userId } = JSON.parse(event.body);

    if (!userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'userId requis' })
      };
    }

    // Récupérer la bannière active
    const { data: banner } = await supabase
      .from('banners')
      .select('id')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!banner) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Aucune bannière active' })
      };
    }

    // Ajouter la fermeture (ou ignorer si déjà fermée)
    await supabase
      .from('banner_dismissals')
      .upsert({
        banner_id: banner.id,
        user_id: userId
      }, {
        onConflict: 'banner_id,user_id'
      });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true })
    };

  } catch (error) {
    console.error('Erreur close-banner:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Erreur serveur' })
    };
  }
};
