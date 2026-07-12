// controllers/adminController.js
const adminRepository = require('../repositories/adminRepository');

let getDashboard = (req, res) => {
    let allCourses = adminRepository.getAllCourses({});
    let allBookings = adminRepository.getAllBookings({});

    res.status(200).render('admin', {
        courses: allCourses,
        bookings: allBookings
    });
};

let getNewCourseForm = (req, res) => {
    res.status(200).render('admin-form', {
        course: null,
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
        res.status(200).render('admin-form', { course: courseToEdit});
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
