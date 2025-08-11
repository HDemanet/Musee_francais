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

// Route de test pour le formulaire (avec envoi d'email réel)
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

    // Vérification des variables d'environnement
    console.log('🔧 Config SMTP:', {
      host: process.env.SMTP_HOST || 'MANQUANT',
      user: process.env.SMTP_USER ? 'OK' : 'MANQUANT',
      pass: process.env.SMTP_PASS ? 'OK' : 'MANQUANT',
      receiver: process.env.RECEIVER_EMAIL || 'MANQUANT'
    });

    // Configuration du transporteur email
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false, // false pour le port 587 (STARTTLS)
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000,
    });

    // Mapping des sujets
    const subjectMap = {
      'visite-individuelle': 'Visite individuelle',
      'visite-groupe': 'Visite de groupe',
      'information': 'Demande d\'information',
      'recherche': 'Recherche historique',
      'autre': 'Autre demande'
    };
    const subjectText = subjectMap[subject] || subject;

    // Options de l'email
    const mailOptions = {
      from: `"Site Musée" <${process.env.SMTP_USER}>`,
      replyTo: `"${name}" <${email}>`,
      to: process.env.RECEIVER_EMAIL || 'museefrancais40@gmail.com',
      subject: `[Contact Musée] ${subjectText}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd;">
          <h2 style="color: #2c5aa0; border-bottom: 2px solid #c9a96e; padding-bottom: 10px;">
            📧 Nouveau message depuis le site du musée
          </h2>

          <div style="background: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <h3 style="color: #2c5aa0; margin-top: 0;">Informations du contact</h3>
            <p><strong>Nom :</strong> ${name}</p>
            <p><strong>Email :</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>Téléphone :</strong> ${phone || 'Non renseigné'}</p>
            <p><strong>Sujet :</strong> ${subjectText}</p>
          </div>

          <div style="background: white; padding: 15px; border-left: 4px solid #c9a96e;">
            <h3 style="color: #2c5aa0; margin-top: 0;">Message :</h3>
            <p style="line-height: 1.6; white-space: pre-line;">${message}</p>
          </div>

          <div style="margin-top: 20px; padding: 10px; background: #e8f4f8; border-radius: 5px; font-size: 12px; color: #666;">
            <p style="margin: 0;">Ce message a été envoyé depuis le formulaire de contact du site web du Musée de la 1ère Armée Française.</p>
            <p style="margin: 5px 0 0 0;">Date d'envoi : ${new Date().toLocaleString('fr-BE')}</p>
          </div>
        </div>
      `,
    };

    console.log('📧 Tentative d\'envoi d\'email...');

    // Vérifier la connexion SMTP
    await transporter.verify();
    console.log('✅ Connexion SMTP vérifiée');

    // Envoyer l'email
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email envoyé avec succès!');
    console.log('📧 Détails:', { messageId: info.messageId, to: mailOptions.to });

    res.status(200).json({
      success: true,
      message: 'Message envoyé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi:', error);
    console.error('📝 Détails de l\'erreur:', {
      code: error.code,
      command: error.command,
      response: error.response,
      message: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi du message: ' + error.message
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
