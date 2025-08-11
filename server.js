const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

console.log('🚀 Démarrage du serveur...');

const app = express();

// Middleware de base
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Log des requêtes
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Test de base
app.get('/', (req, res) => {
  console.log('📍 Route / appelée');
  res.send(`
    <h1>🎯 Serveur fonctionnel !</h1>
    <p>Date: ${new Date().toISOString()}</p>
    <p>Port: ${process.env.PORT || 3000}</p>
    <p><a href="/health">Test santé</a></p>
    <p><a href="/contact.html">Page contact</a></p>
  `);
});

// Route de santé
app.get('/health', (req, res) => {
  console.log('💚 Health check appelé');
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development'
  });
});

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// Route de test pour le formulaire (avec validation basique)
app.post('/send', async (req, res) => {
  console.log('📬 Route /send appelée');
  console.log('📦 Body reçu:', req.body);

  try {
    const { name, email, phone, subject, message } = req.body;

    // Validation basique
    if (!name || !email || !subject || !message) {
      console.log('❌ Validation échouée - champs manquants');
      return res.status(400).json({
        success: false,
        message: 'Tous les champs obligatoires doivent être remplis'
      });
    }

    // Validation email simple
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Email invalide:', email);
      return res.status(400).json({
        success: false,
        message: 'Format d\'email invalide'
      });
    }

    console.log('✅ Validation OK pour:', { name, email, subject });

    // Pour l'instant, on simule l'envoi d'email
    console.log('📧 Simulation d\'envoi d\'email...');

    // TODO: Ajouter nodemailer ici une fois que ça marche

    res.status(200).json({
      success: true,
      message: 'Message reçu et validé (email pas encore envoyé)'
    });

  } catch (error) {
    console.error('❌ Erreur dans /send:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur: ' + error.message
    });
  }
});

// Gestion des erreurs
app.use((error, req, res, next) => {
  console.error('❌ Erreur serveur:', error);
  res.status(500).json({ error: error.message });
});

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur le port ${PORT}`);
  console.log(`🌍 URL: https://votre-app.herokuapp.com`);
}).on('error', (err) => {
  console.error('❌ Erreur de démarrage:', err);
});
