// server.js - Serveur Node.js pour le Musée de la 1ère Armée Française
require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration de la base de données PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(express.json({ limit: '10mb' })); // Pour les images base64
app.use(express.static('public')); // Servir les fichiers depuis le dossier public

// Variables d'environnement
const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;

if (!JWT_SECRET || !ADMIN_PASSWORD_HASH) {
  console.error('❌ Variables d\'environnement manquantes : JWT_SECRET ou ADMIN_PASSWORD_HASH');
  process.exit(1);
}

// ===== INITIALISATION DE LA BASE DE DONNÉES =====
async function initDatabase() {
  try {
    console.log('🔄 Initialisation de la base de données...');

    // Créer la table des bannières
    await pool.query(`
      CREATE TABLE IF NOT EXISTS banners (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL DEFAULT 'event',
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        date DATE,
        time TIME,
        link TEXT,
        image TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Créer la table des fermetures par utilisateur
    await pool.query(`
      CREATE TABLE IF NOT EXISTS banner_dismissals (
        id SERIAL PRIMARY KEY,
        banner_id INTEGER REFERENCES banners(id) ON DELETE CASCADE,
        user_id VARCHAR(255) NOT NULL,
        dismissed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(banner_id, user_id)
      )
    `);

    console.log('✅ Base de données initialisée avec succès');
  } catch (error) {
    console.error('❌ Erreur initialisation DB:', error.message);
    // Ne pas arrêter le serveur, juste logger l'erreur
  }
}

// ===== ROUTES POUR LES PAGES STATIQUES =====
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ===== API AUTHENTIFICATION =====
app.post('/api/admin/login', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Mot de passe requis' });
    }

    console.log('🔐 Tentative de connexion admin');

    // Vérifier le mot de passe
    const isValid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);

    if (!isValid) {
      console.log('❌ Mot de passe incorrect');
      return res.status(401).json({ error: 'Mot de passe incorrect' });
    }

    // Générer un token JWT
    const token = jwt.sign(
      { role: 'admin', timestamp: Date.now() },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ Connexion admin réussie');
    res.json({
      success: true,
      token,
      message: 'Connexion réussie'
    });

  } catch (error) {
    console.error('❌ Erreur connexion:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Middleware de vérification du token admin
function verifyAdminToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requis' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Accès admin requis' });
    }
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token invalide' });
  }
}

// ===== API BANNIÈRES PUBLIQUES =====

// Récupérer la bannière active pour un utilisateur
app.get('/api/banner/current', async (req, res) => {
  try {
    const { userId } = req.query;

    // Récupérer la bannière active
    const bannerResult = await pool.query(`
      SELECT * FROM banners
      WHERE is_active = true
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (bannerResult.rows.length === 0) {
      return res.json({ banner: null, userHasClosed: false });
    }

    const banner = bannerResult.rows[0];

    // Vérifier si l'utilisateur a fermé cette bannière
    let userHasClosed = false;
    if (userId) {
      const dismissalResult = await pool.query(`
        SELECT id FROM banner_dismissals
        WHERE banner_id = $1 AND user_id = $2
      `, [banner.id, userId]);

      userHasClosed = dismissalResult.rows.length > 0;
    }

    res.json({
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
    });

  } catch (error) {
    console.error('❌ Erreur récupération bannière:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Marquer une bannière comme fermée pour un utilisateur
app.post('/api/banner/close', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId requis' });
    }

    // Récupérer la bannière active
    const bannerResult = await pool.query(`
      SELECT id FROM banners
      WHERE is_active = true
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (bannerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Aucune bannière active' });
    }

    const bannerId = bannerResult.rows[0].id;

    // Ajouter la fermeture (ou ignorer si déjà fermée)
    await pool.query(`
      INSERT INTO banner_dismissals (banner_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT (banner_id, user_id) DO NOTHING
    `, [bannerId, userId]);

    console.log(`🗙 Bannière ${bannerId} fermée par utilisateur ${userId}`);
    res.json({ success: true });

  } catch (error) {
    console.error('❌ Erreur fermeture bannière:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ===== API ADMIN BANNIÈRES =====

// Créer/modifier une bannière (admin seulement)
app.post('/api/admin/banner', verifyAdminToken, async (req, res) => {
  try {
    const { type, title, message, date, time, link, image } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'Titre et message requis' });
    }

    console.log('📝 Création nouvelle bannière:', title);

    // Désactiver toutes les bannières existantes
    await pool.query('UPDATE banners SET is_active = false');

    // Créer la nouvelle bannière
    const result = await pool.query(`
      INSERT INTO banners (type, title, message, date, time, link, image, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, true)
      RETURNING id
    `, [type || 'event', title, message, date || null, time || null, link || null, image || null]);

    console.log('✅ Bannière créée avec ID:', result.rows[0].id);
    res.json({
      success: true,
      bannerId: result.rows[0].id,
      message: 'Bannière créée avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur création bannière:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer la bannière active (admin seulement)
app.delete('/api/admin/banner/current', verifyAdminToken, async (req, res) => {
  try {
    console.log('🗑️ Suppression bannière active');
    await pool.query('UPDATE banners SET is_active = false');
    res.json({ success: true, message: 'Bannière supprimée' });
  } catch (error) {
    console.error('❌ Erreur suppression bannière:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Réactiver une bannière fermée (admin seulement)
app.post('/api/admin/banner/reopen', verifyAdminToken, async (req, res) => {
  try {
    console.log('🔄 Réactivation bannière pour tous les utilisateurs');

    // Supprimer toutes les fermetures de la bannière active
    const bannerResult = await pool.query(`
      SELECT id FROM banners
      WHERE is_active = true
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (bannerResult.rows.length > 0) {
      const deletedCount = await pool.query(`
        DELETE FROM banner_dismissals
        WHERE banner_id = $1
      `, [bannerResult.rows[0].id]);

      console.log(`🔄 ${deletedCount.rowCount} fermetures supprimées`);
    }

    res.json({ success: true, message: 'Bannière réactivée' });
  } catch (error) {
    console.error('❌ Erreur réactivation bannière:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ===== ROUTE DE DIAGNOSTIC =====
app.get('/api/status', async (req, res) => {
  try {
    // Test de la base de données
    const dbResult = await pool.query('SELECT NOW()');
    const bannerCount = await pool.query('SELECT COUNT(*) FROM banners');

    res.json({
      status: 'OK',
      database: 'Connected',
      timestamp: dbResult.rows[0].now,
      totalBanners: parseInt(bannerCount.rows[0].count),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      database: 'Disconnected',
      error: error.message
    });
  }
});

// ===== GESTION DES ERREURS 404 =====
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', 'index.html')); // CORRIGÉ: inclut 'public'
});

// ===== DÉMARRAGE DU SERVEUR =====
async function startServer() {
  await initDatabase();

  app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📝 Admin: ${process.env.NODE_ENV === 'production' ? 'https://museefrancais.herokuapp.com' : 'http://localhost:' + PORT}/admin`);
    console.log(`🔍 Status: ${process.env.NODE_ENV === 'production' ? 'https://museefrancais.herokuapp.com' : 'http://localhost:' + PORT}/api/status`);
  });
}

// Gestion des erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

startServer().catch(console.error);
