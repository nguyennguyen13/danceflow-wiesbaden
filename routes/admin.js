// routes/admin.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Pfad: http://localhost:3000/admin/
router.route('/')
    .get(adminController.getDashboard);
    //.get(roleMiddleware.requireAdmin, adminController.getDashboard);

// Pfad: http://localhost:3000/admin/new-course
router.route('/new-course')
    .get(adminController.getNewCourseForm)
    .post(adminController.createCourse);
    //.get(roleMiddleware.requireAdmin, adminController.getNewCourseForm)
    //.post(roleMiddleware.requireAdmin, adminController.createCourse);

// Pfad: http://localhost:3000/admin/edit-course/:id
router.route('/edit-course/:id')
    .get(adminController.getEditCourseForm)
    .post(adminController.updateCourse);
    //.get(roleMiddleware.requireAdmin,adminController.getEditCourseForm)
    //.post(roleMiddleware.requireAdmin,adminController.updateCourse);

module.exports = router;
