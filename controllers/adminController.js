// controllers/adminController.js
const adminRepository = require('../repositories/adminRepository');

let getDashboard = (req, res) => {
    let style = req.query.style || '';
    let level = req.query.level || '';
    let courseId = req.query.courseId || '';

    // Die gesamte Filterung und Auto-Logik delegieren wir ans Repository
    let filteredCourses = adminRepository.getAllCourses({ style, level, courseId});
    let bookings = adminRepository.getAllBookings();

    let allStyles = adminRepository.getUniqueStyles();
    let allLevels = adminRepository.getUniqueLevels();

    res.status(200).render('admin', {
        courses: filteredCourses,
        allStyles: allStyles,
        allLevels: allLevels,
        currentFilters: { style, level },
        bookings: bookings
    });
};

let getNewCourseForm = (req, res) => {
    let allStyles = adminRepository.getUniqueStyles();
    let allLevels = adminRepository.getUniqueLevels();

    res.status(200).render('admin-form', {
        course: null,
        allStyles,
        allLevels
    });
};

let createCourse = (req, res) => {
    let data = req.body;
    adminRepository.createCourse(data);
    res.status(201).redirect('/admin');
};

let getEditCourseForm = (req, res) => {
    let id = req.params.id;
    let courseToEdit = adminRepository.getCourse(id);

    if (courseToEdit) {
        let allStyles = adminRepository.getUniqueStyles();
        let allLevels = adminRepository.getUniqueLevels();
        res.status(200).render('admin-form', { course: courseToEdit, allStyles, allLevels });
    } else {
        res.status(404).redirect('/admin');
    }
};

let updateCourse = (req, res) => {
    let id = req.params.id;
    let data = req.body;

    let changeCourse = adminRepository.updateCourse(id, data);

    if (changeCourse.isNew) {
        res.status(201).redirect('/admin?created=true');
    } else {
        res.status(200).redirect('/admin?updated=true');
    }
};

module.exports = {
    getDashboard,
    getNewCourseForm,
    createCourse,
    getEditCourseForm,
    updateCourse
};
