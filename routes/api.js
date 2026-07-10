const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const messagesPath = path.join(__dirname, '..', 'data', 'messages.json');

// POST /api/contact (Der Pfad in der app.js ist /api, hier reicht also /contact)
router.post('/contact', (req, res) => {

  const { firstname, lastname, course, partner, email, message, confirm } = req.body;

  // 1. Validierung
  if (!firstname || !lastname || !course || !email || !confirm) {
    return res.status(400).send('Bitte alle Pflichtfelder ausfüllen.');
  }

  try {
    // 2. Datei sicher lesen
    let messages = [];
    if (fs.existsSync(messagesPath)) {
        const fileContent = fs.readFileSync(messagesPath, 'utf-8');
        // Sicherstellen, dass das JSON gültig ist
        messages = fileContent ? JSON.parse(fileContent) : [];
    }

    // 3. Neue Nachricht erstellen
    const newMessage = {
        id: 'msg-' + Date.now(), // Date.now() ist für IDs sicherer als .length
        firstname,
        lastname,
        course,
        partner,
        email,
        message,
        confirm,
        createdAt: new Date().toISOString().split('T')[0]
    };

    // 4. Daten hinzufügen und speichern
    messages.push(newMessage);
    fs.writeFileSync(messagesPath, JSON.stringify(messages, null, 2));

    console.log("Neue Anfrage erfolgreich gespeichert:", newMessage.id);
    res.status(200).send('Erfolgreich gespeichert');
  } catch (err) {
    console.error("Fehler beim Speichern der Nachricht:", err);
    res.status(500).send('Fehler beim Speichern der Anfrage.');
  }
});

module.exports = router;