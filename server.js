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

// Route de test pour diagnostic email
app.get('/test-email', async (req, res) => {
  console.log('🧪 Test de diagnostic email');

  try {
    // Configuration du transporteur
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    console.log('🔧 Test de connexion SMTP...');
    await transporter.verify();
    console.log('✅ Connexion SMTP OK');

    // Email de test ultra-simple
    const testMailOptions = {
      from: process.env.SMTP_USER,
      to: 'demanet.helene@gmail.com', // Votre email pour test
      subject: 'Test email depuis Heroku',
      text: `Test envoyé le ${new Date().toISOString()}\nDepuis: ${process.env.SMTP_HOST}\nUtilisateur: ${process.env.SMTP_USER}`,
      html: `
        <h2>🧪 Email de test</h2>
        <p><strong>Date:</strong> ${new Date().toISOString()}</p>
        <p><strong>Serveur:</strong> ${process.env.SMTP_HOST}</p>
        <p><strong>Utilisateur:</strong> ${process.env.SMTP_USER}</p>
        <p>Si vous recevez cet email, la configuration fonctionne !</p>
      `
    };

    console.log('📧 Envoi email de test vers:', testMailOptions.to);
    const info = await transporter.sendMail(testMailOptions);

    console.log('✅ Email de test envoyé!');
    console.log('📊 Résultat complet:', info);

    res.json({
      success: true,
      message: 'Email de test envoyé',
      details: {
        messageId: info.messageId,
        to: testMailOptions.to,
        accepted: info.accepted,
        rejected: info.rejected,
        response: info.response
      }
    });

  } catch (error) {
    console.error('❌ Erreur test email:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: {
        code: error.code,
        command: error.command,
        response: error.response
      }
    });
  }
});
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

    // Mapping des sujets
    const subjectMap = {
      'visite-individuelle': 'Visite individuelle',
      'visite-groupe': 'Visite de groupe',
      'information': 'Demande d\'information',
      'recherche': 'Recherche historique',
      'autre': 'Autre demande'
    };
    const subjectText = subjectMap[subject] || subject;

    console.log('🔧 Config SMTP:', {
      host: 'smtp-relay.brevo.com',
      user: process.env.SMTP_USER ? 'OK' : 'MANQUANT',
      pass: process.env.SMTP_PASS ? 'OK' : 'MANQUANT',
      receiver: 'museefrancais40@gmail.com'
    });

    // Configuration du transporteur email - Version simplifiée
    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Options de l'email - Configuration minimale qui fonctionne avec Brevo
    const mailOptions = {
      from: process.env.SMTP_USER, // Utilisez exactement l'email technique Brevo
      to: 'museefrancais40@gmail.com',
      replyTo: email, // L'email du visiteur pour répondre
      subject: `[Musée] ${subjectText} de ${name}`,
      text: `
Nouveau message depuis le site web du musée

CONTACT:
Nom: ${name}
Email: ${email}
Téléphone: ${phone || 'Non renseigné'}
Sujet: ${subjectText}

MESSAGE:
${message}

---
Envoyé le ${new Date().toLocaleString('fr-BE')} depuis https://www.museefrancais.com
Pour répondre, utilisez l'email: ${email}
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2c5aa0;">📧 Nouveau message depuis le site web</h2>

          <div style="background: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <h3>Informations du contact</h3>
            <p><strong>Nom:</strong> ${name}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>Téléphone:</strong> ${phone || 'Non renseigné'}</p>
            <p><strong>Sujet:</strong> ${subjectText}</p>
          </div>

          <div style="background: white; padding: 15px; border-left: 4px solid #c9a96e;">
            <h3>Message:</h3>
            <p style="line-height: 1.6;">${message.replace(/\n/g, '<br>')}</p>
          </div>

          <div style="margin-top: 20px; padding: 10px; background: #e8f4f8; border-radius: 5px; font-size: 12px;">
            <p>Envoyé le ${new Date().toLocaleString('fr-BE')} depuis le site web du musée</p>
            <p><strong>Pour répondre:</strong> Cliquez sur "Répondre" pour écrire directement à ${email}</p>
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
    console.log('📧 Détails:', {
      messageId: info.messageId,
      to: mailOptions.to,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response
    });

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
