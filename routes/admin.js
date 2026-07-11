// routes/admin.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Pfad: http://localhost:3000/admin/
router.route('/')
    .get(adminController.getDashboard);

// Pfad: http://localhost:3000/admin/new-course
router.route('/new-course')
    .get(adminController.getNewCourseForm)
    .post(adminController.createCourse);

// Pfad: http://localhost:3000/admin/edit-course/:id
router.route('/edit-course/:id')
    .get(adminController.getEditCourseForm)
    .post(adminController.updateCourse);

module.exports = router;
