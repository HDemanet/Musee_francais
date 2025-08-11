const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config(); // Charge les variables d'environnement

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Servir les fichiers statiques (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Route principale (accueil)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route du formulaire de contact avec validation améliorée
app.post('/send', async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  // Validation serveur - SÉCURITÉ IMPORTANTE
  if (!name || !email || !subject || !message) {
    return res.status(400).json({
      success: false,
      message: 'Tous les champs obligatoires doivent être remplis'
    });
  }

  // Validation format email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Format d\'email invalide'
    });
  }

  // Validation longueur des champs (sécurité)
  if (name.length > 100 || email.length > 100 || message.length > 2000) {
    return res.status(400).json({
      success: false,
      message: 'Un ou plusieurs champs dépassent la longueur autorisée'
    });
  }

  // Configuration Nodemailer avec Brevo
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // false pour le port 587 (STARTTLS)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Options supplémentaires pour la stabilité
    connectionTimeout: 60000, // 60 secondes
    greetingTimeout: 30000,   // 30 secondes
    socketTimeout: 60000,     // 60 secondes
  });

  // Mapping des sujets pour un meilleur affichage
  const subjectMap = {
    'visite-individuelle': 'Visite individuelle',
    'visite-groupe': 'Visite de groupe',
    'information': 'Demande d\'information',
    'recherche': 'Recherche historique',
    'autre': 'Autre demande'
  };

  const subjectText = subjectMap[subject] || subject;

  const mailOptions = {
    from: `"Site Musée" <${process.env.SMTP_USER}>`, // Utiliser votre email Brevo
    replyTo: `"${name}" <${email}>`, // Pour répondre directement au visiteur
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

  try {
    // Vérifier la connexion SMTP avant d'envoyer
    await transporter.verify();
    console.log('✅ Connexion SMTP vérifiée');

    // Envoyer l'email
    await transporter.sendMail(mailOptions);
    console.log('✅ Email envoyé avec succès via Brevo');
    console.log(`📧 De: ${name} (${email}) - Sujet: ${subjectText}`);

    res.status(200).json({
      success: true,
      message: 'Message envoyé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi :', error);

    // Log détaillé pour debug en production
    console.error('Détails de l\'erreur:', {
      code: error.code,
      command: error.command,
      response: error.response,
      message: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi du message. Veuillez réessayer plus tard.'
    });
  }
});

// Route de test pour vérifier que le serveur fonctionne
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Gestion des erreurs serveur
app.use((error, req, res, next) => {
  console.error('Erreur serveur:', error);
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur'
  });
});

// Lancer le serveur (PORT fourni par Heroku ou 3000 en local)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📧 SMTP configuré: ${process.env.SMTP_HOST || 'smtp-relay.brevo.com'}`);
});
