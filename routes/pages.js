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

// ===== POST /api/contact – Kontaktformular validieren & speichern (Person 1) =====
// Hinweis: In der Endpunkt-Übersicht (Doku Abschnitt 7) steht dieser Endpunkt
// eigentlich unter api.js (Person 4). Sprecht euch im Team ab, wo er final
// landen soll – Logik ist unabhängig vom Dateiort identisch.
router.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).send('Bitte alle Felder ausfüllen.');
  }

  const messages = JSON.parse(fs.readFileSync(messagesPath, 'utf-8'));

  const newMessage = {
    id: 'msg-' + String(messages.length + 1).padStart(4, '0'),
    name,
    email,
    message,
    createdAt: new Date().toISOString().split('T')[0]
  };

  messages.push(newMessage);
  fs.writeFileSync(messagesPath, JSON.stringify(messages, null, 2));

  res.redirect('/#kontakt');
});

module.exports = router;
