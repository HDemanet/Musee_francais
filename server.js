const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

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

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur le port ${PORT}`);
  console.log(`🌍 URL: https://votre-app.herokuapp.com`);
}).on('error', (err) => {
  console.error('❌ Erreur de démarrage:', err);
});
