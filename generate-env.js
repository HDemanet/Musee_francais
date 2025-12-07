// generate-env.js - Générer les variables d'environnement
const crypto = require('crypto');
const bcrypt = require('bcrypt');

async function generateEnv() {
  console.log('🔐 Génération des variables d\'environnement...\n');

  // Générer JWT_SECRET
  const jwtSecret = crypto.randomBytes(64).toString('hex');
  console.log('JWT_SECRET (copie cette valeur) :');
  console.log(jwtSecret);
  console.log('');

  // Générer ADMIN_PASSWORD_HASH pour "ManoeuvreDyle"
  const password = 'ManoeuvreDyle';
  const hash = await bcrypt.hash(password, 10);
  console.log('ADMIN_PASSWORD_HASH (copie cette valeur) :');
  console.log(hash);
  console.log('');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Valeurs générées avec succès !');
  console.log('');
  console.log('📋 PROCHAINES ÉTAPES :');
  console.log('1. Copie ces valeurs');
  console.log('2. Va sur Netlify → Site Settings → Environment Variables');
  console.log('3. Ajoute ces 4 variables :');
  console.log('   - SUPABASE_URL');
  console.log('   - SUPABASE_KEY');
  console.log('   - JWT_SECRET (valeur ci-dessus)');
  console.log('   - ADMIN_PASSWORD_HASH (valeur ci-dessus)');
  console.log('');
  console.log('🔑 Mot de passe admin : ManoeuvreDyle');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

generateEnv().catch(console.error);
