const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { requireAdmin } = require('../middlewares/roleMiddleware');

const messagesPath = path.join(__dirname, '..', 'data', 'messages.json');
const COURSES_FILE = path.join(__dirname, '..', 'data', 'courses.json');
const BOOKINGS_FILE = path.join(__dirname, '..', 'data', 'bookings.json');

router.get('/', (req, res) => {
  res.render('index');
});

/**
 * GET  /admin
 * Admin-Dashboard (geschützt)
 */

router.get('/admin', requireAdmin, (req, res) => {
  try {
    const fileContent = fs.readFileSync(messagesPath, 'utf-8');
    const messages = JSON.parse(fileContent || '[]');

    let courses = [];
    let bookings = [];

    if (fs.existsSync(COURSES_FILE)) {
      const coursesData = fs.readFileSync(COURSES_FILE, 'utf-8');
      courses = JSON.parse(coursesData || '[]');
    }

    if (fs.existsSync(BOOKINGS_FILE)) {
      const bookingsData = fs.readFileSync(BOOKINGS_FILE, 'utf-8');
      bookings = JSON.parse(bookingsData || '[]');
    }

    res.render('admin', {
      messages: messages,
      courses: courses,
      bookings: bookings
    });
  } catch (err) {
    res.status(500).send('Fehler beim Laden der Daten.');
  }
});


module.exports = router;