const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const coursesPath = path.join(__dirname, '..', 'data', 'courses.json');
const bookingsPath = path.join(__dirname, '..', 'data', 'bookings.json');

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8') || '[]');
  } catch (error) {
    console.error(`Fehler beim Lesen von ${filePath}:`, error);
    return [];
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function courseWithAvailability(course, bookings) {
  const bookedParticipants = bookings
    .filter(booking => booking.courseId === course.id && booking.status !== 'cancelled')
    .reduce((total, booking) => total + (booking.partnerName?.trim() ? 2 : 1), 0);
  return {
    ...course,
    bookedParticipants,
    availablePlaces: Math.max(0, course.maxParticipants - bookedParticipants),
    isFull: bookedParticipants >= course.maxParticipants
  };
}

router.get('/courses', (req, res) => {
  const bookings = readJson(bookingsPath);
  const courses = readJson(coursesPath).filter(course => course.status === 'active')
    .map(course => courseWithAvailability(course, bookings));
  const { style = '', level = '', ageGroup = '', weekday = '' } = req.query;
  const filteredCourses = courses.filter(course =>
    (!style || course.style === style) && (!level || course.level === level) &&
    (!ageGroup || course.ageGroup === ageGroup) && (!weekday || course.weekday === weekday)
  );
  res.render('courses', {
    courses: filteredCourses, filters: { style, level, ageGroup, weekday },
    styles: [...new Set(courses.map(course => course.style))].sort(),
    levels: [...new Set(courses.map(course => course.level))].sort(),
    ageGroups: [...new Set(courses.map(course => course.ageGroup))].sort(),
    weekdays: [...new Set(courses.map(course => course.weekday))]
  });
});

router.get('/courses/:id', (req, res) => {
  const course = readJson(coursesPath).find(item => item.id === req.params.id && item.status === 'active');
  if (!course) return res.status(404).render('course-not-found');
  res.render('course-detail', { course: courseWithAvailability(course, readJson(bookingsPath)), error: null, form: {} });
});

router.post('/courses/:id/book', (req, res) => {
  const courses = readJson(coursesPath);
  const course = courses.find(item => item.id === req.params.id && item.status === 'active');
  if (!course) return res.status(404).render('course-not-found');
  const customerName = (req.body.customerName || '').trim();
  const partnerName = (req.body.partnerName || '').trim();
  const email = (req.body.email || '').trim();
  const bookings = readJson(bookingsPath);
  const enrichedCourse = courseWithAvailability(course, bookings);
  const form = { customerName, partnerName, email };
  if (!customerName || !email) return res.status(400).render('course-detail', { course: enrichedCourse, error: 'Bitte fülle Name und E-Mail-Adresse aus.', form });
  const requestedPlaces = partnerName ? 2 : 1;
  if (enrichedCourse.availablePlaces < requestedPlaces) return res.status(409).render('course-detail', { course: enrichedCourse, error: 'Für diese Anmeldung sind nicht genügend freie Plätze verfügbar.', form });
  bookings.push({ id: `bk-${Date.now()}`, courseId: course.id, customerName, partnerName, email, status: 'confirmed', createdAt: new Date().toISOString().slice(0, 10) });
  writeJson(bookingsPath, bookings);
  course.bookedParticipants = enrichedCourse.bookedParticipants + requestedPlaces;
  writeJson(coursesPath, courses);
  res.render('booking-success', { course, requestedPlaces });
});

module.exports = router;
