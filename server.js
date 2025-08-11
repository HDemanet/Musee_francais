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

    console.log('✅ Validation OK pour:', { name, email, subject });

    // Vérification des variables d'environnement
    console.log('🔧 Config SMTP:', {
      host: process.env.SMTP_HOST || 'MANQUANT',
      user: process.env.SMTP_USER ? 'OK' : 'MANQUANT',
      pass: process.env.SMTP_PASS ? 'OK' : 'MANQUANT',
      receiver: process.env.RECEIVER_EMAIL || 'MANQUANT'
    });

    // Configuration du transporteur email
    const transporter = nodemailer.createTransport({
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

    // Options de l'email avec configuration correcte pour Brevo
    const mailOptions = {
      from: `"Musée de la 1ère Armée Française" <${process.env.SMTP_USER}>`, // Email technique Brevo
      replyTo: `"${name}" <${email}>`, // Email du visiteur pour répondre
      to: 'museefrancais40@gmail.com', // Email du musée
      subject: `[Site Web] ${subjectText} - ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd;">
          <div style="background: #2c5aa0; color: white; padding: 15px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">📧 Nouveau message depuis le site web</h1>
          </div>

          <div style="background: #f8f9fa; padding: 20px; margin: 20px 0;">
            <h2 style="color: #2c5aa0; margin-top: 0;">👤 Informations du contact</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Nom :</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${name}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Email :</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;"><a href="mailto:${email}">${email}</a></td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Téléphone :</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${phone || 'Non renseigné'}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Sujet :</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${subjectText}</td></tr>
            </table>
          </div>

          <div style="background: white; padding: 20px; border-left: 4px solid #c9a96e;">
            <h2 style="color: #2c5aa0; margin-top: 0;">💬 Message :</h2>
            <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; line-height: 1.6;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>

          <div style="margin-top: 20px; padding: 15px; background: #e8f4f8; border-radius: 5px; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: #666;">
              📅 Message reçu le ${new Date().toLocaleString('fr-BE')} depuis le formulaire de contact du site web<br>
              🌐 <a href="https://www.museefrancais.com" style="color: #2c5aa0;">www.museefrancais.com</a>
            </p>
          </div>

          <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 5px;">
            <p style="margin: 0; font-size: 14px;">
              <strong>💡 Pour répondre :</strong> Cliquez sur "Répondre" dans votre messagerie,
              l'email sera automatiquement adressé à ${email}
            </p>
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
