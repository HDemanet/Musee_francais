const express = require('express');
const path = require('path');

console.log('🚀 Démarrage du serveur statique...');

const app = express();

// Servir les fichiers statiques depuis le dossier public
app.use(express.static(path.join(__dirname, 'public')));

// Route principale - redirige vers index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route de santé pour vérifier que le serveur fonctionne
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Serveur statique fonctionnel',
    timestamp: new Date().toISOString(),
    formType: 'Formspree'
  });
});

// Gestion des erreurs 404 - redirige vers l'accueil
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Serveur statique démarré sur le port ${PORT}`);
  console.log(`🌐 Site accessible sur : https://www.museefrancais.com`);
  console.log(`📧 Formulaire de contact géré par Formspree`);
}).on('error', (err) => {
  console.error('❌ Erreur de démarrage:', err);
});
