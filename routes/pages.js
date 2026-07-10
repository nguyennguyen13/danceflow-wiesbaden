const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const messagesPath = path.join(__dirname, '..', 'data', 'messages.json');

// ===== GET / – Startseite rendern (Person 1) =====
// Hinweis: "user" und "currentPath" müssen hier NICHT mehr übergeben werden –
// Person 3 setzt beides bereits global via res.locals in app.js.
router.get('/', (req, res) => {
  res.render('index');
});

const auth = require('basic-auth');
const checkAuth = (req, res, next) => {
  const credentials = auth(req);

  // Setze hier deinen Benutzernamen und Passwort fest
  // Nutzername = admin; Passwort = geheim123;
  if (credentials && credentials.name === 'admin' && credentials.pass === 'geheim123') {
    return next(); // Passwort korrekt, weiter zur Seite
  }

  // Wenn falsch, fordere zur Authentifizierung auf
  res.set('WWW-Authenticate', 'Basic realm="Admin-Bereich"');
  res.status(401).send('Zugriff verweigert – Bitte einloggen.');
};

/* http://localhost:3000/admin */
router.get('/admin', checkAuth, (req, res) => {
    try {
      // Datei lesen
      const fileContent = fs.readFileSync(messagesPath, 'utf-8');
      const messages = JSON.parse(fileContent || '[]');
      
      // Daten an die admin.ejs Seite schicken
      res.render('admin', { messages: messages });
    } catch (err) {
      res.status(500).send('Fehler beim Laden der Nachrichten.');
    }
  });


module.exports = router;
