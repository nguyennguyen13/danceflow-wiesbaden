const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { requireAuth } = require('../middlewares/roleMiddleware');

const messagesPath  = path.join(__dirname, '..', 'data', 'messages.json');
const COURSES_FILE = path.join(__dirname, '..', 'data', 'courses.json');
const BOOKINGS_FILE = path.join(__dirname, '..', 'data', 'bookings.json');


function readJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return [];
  }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * POST /api/contact
 * Kontaktformular speichern
 */

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
      messages = fileContent ? JSON.parse(fileContent) : [];
    }

    // 3. Neue Nachricht erstellen
    const newMessage = {
      id: 'msg-' + Date.now(),
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

/**
 * POST /bookings
 * Buchungs-API mit Warteliste (geschützt)
 */

router.post('/bookings', requireAuth, (req, res) => {
  const { courseId, customerName, isPartner, partnerName, email } = req.body;

  // Validierung
  if (!courseId || !customerName || !email) {
    return res.status(400).json({
      error: 'Kurs-ID, Name und E-Mail sind erforderlich'
    });
  }

  // Kurs laden
  let courses = readJSON(COURSES_FILE);
  const course = courses.find(c => c.id === courseId);
  if (!course) {
    return res.status(404).json({ error: 'Kurs nicht gefunden' });
  }

  // Buchungen laden
  let bookings = readJSON(BOOKINGS_FILE);

  // Prüft, ob User diesen Kurs bereits gebucht hat
  const existingBooking = bookings.find(b =>
    b.courseId === courseId && b.userId === req.session.user.id
  );

  if (existingBooking) {
    return res.status(409).json({
      error: `Sie haben diesen Kurs bereits gebucht (Status: ${existingBooking.status})`
    });
  }

  // Zählen bestätigter Buchungen
  const confirmedCount = bookings.filter(b =>
    b.courseId === courseId && b.status === 'Bestätigt'
  ).length;

  // Status entscheiden
  let status = 'Bestätigt';
  let message = 'Buchung erfolgreich!';
  if (confirmedCount >= course.maxParticipants) {
    status = 'Warteliste';
    message = 'Kurs ist voll! Sie wurden auf die Warteliste gesetzt.';
  }

  // Buchung speichern
  const newBooking = {
    bookingId: 'bk-' + Date.now(),
    courseId,
    customerName: customerName.trim(),
    email: email.trim(),
    isPartner: isPartner || false,
    partnerName: partnerName ? partnerName.trim() : '',
    status: status,
    createdAt: new Date().toISOString().split('T')[0],
    userId: req.session.user.id,
    userEmail: req.session.user.email,
    userName: req.session.user.name
  };

  bookings.push(newBooking);
  writeJSON(BOOKINGS_FILE, bookings);

  // Aktualisiere bookedParticipants
  const updatedConfirmed = bookings.filter(b =>
    b.courseId === courseId && b.status === 'Bestätigt'
  ).length;

  const courseIndex = courses.findIndex(c => c.id === courseId);
  if (courseIndex !== -1) {
    courses[courseIndex].bookedParticipants = updatedConfirmed;
    writeJSON(COURSES_FILE, courses);
  }

  res.json({
    success: true,
    booking: newBooking,
    message: message,
    status: status
  });
});


module.exports = router;