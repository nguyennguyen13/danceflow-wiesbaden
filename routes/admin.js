const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Absoluter Pfad zur JSON-Datei
const dataFilePath = path.join(__dirname, '../data/courses.json');

// HILFSFUNKTION: Liest die Kurse bei jedem Request frisch ein (Fehlte im Code!)
const getCourses = () => {
    try {
        if (!fs.existsSync(dataFilePath)) {
            fs.mkdirSync(path.dirname(dataFilePath), { recursive: true });
            fs.writeFileSync(dataFilePath, JSON.stringify([], null, 4), 'utf-8');
            return [];
        }
        const fileData = fs.readFileSync(dataFilePath, 'utf-8');
        return JSON.parse(fileData || '[]');
    } catch (error) {
        console.error('Fehler beim Lesen der JSON:', error);
        return [];
    }
};

const getBookings = () => {
    const bookingsFilePath = path.join(__dirname, '../data/bookings.json');
    try {
        if (!fs.existsSync(bookingsFilePath)) {
            fs.mkdirSync(path.dirname(bookingsFilePath), { recursive: true });
            fs.writeFileSync(bookingsFilePath, JSON.stringify([], null, 4), 'utf-8');
            return [];
        }
        return JSON.parse(fs.readFileSync(bookingsFilePath, 'utf-8') || '[]');
    } catch (error) {
        console.error('Fehler beim Lesen der Buchungen:', error);
        return [];
    }
}

// 1. GET: Übersicht aller Kurse (Admin-Hauptseite)
router.get('/', (req, res) => {
    const courses = getCourses();
    const bookings = getBookings();
    res.render('admin', { 
        courses: courses,
        bookings: bookings
    }); 
});

// 2. GET: Formular zum Erstellen eines neuen Kurses anzeigen
router.get('/new-course', (req, res) => {
    res.render('admin-form', { course: null }); 
});

// 3. POST: Kurs speichern
router.post('/new-course', (req, res) => {
    const courses = getCourses();
    const { name, style, level, ageGroup, weekday, time, startDate, maxParticipants } = req.body;
    
    const styleSlug = style ? style.toLowerCase().replace(/[^a-z0-9]/g, '') : 'kurs';
    const newId = `${styleSlug}-${101 + courses.length}`;
    
    const newCourse = {
        id: newId, name, style, level, ageGroup, weekday, time, startDate,
        maxParticipants: parseInt(maxParticipants) || 0,
        bookedParticipants: 0, status: "active"
    };
    
    courses.push(newCourse);
    
    try {
        fs.writeFileSync(dataFilePath, JSON.stringify(courses, null, 4), 'utf-8');
        res.redirect('/admin'); 
    } catch (error) {
        console.error(error);
        res.status(500).send('❌ Fehler beim Speichern');
    }
});

// 5. GET: Bestehenden Kurs in demselben Formular BEARBEITEN
router.get('/edit-course/:id', (req, res) => {
    const courses = getCourses();
    const courseToEdit = courses.find(c => c.id === req.params.id);
    
    if (!courseToEdit) {
        return res.redirect('/admin');
    }
    
    // Wir rendern dasselbe Formular, übergeben aber den gefundenen Kurs!
    res.render('admin-form', { course: courseToEdit });
});

// 6. POST: Die geänderten Kursdaten empfangen und in der JSON updaten
router.post('/edit-course/:id', (req, res) => {
    const courseId = req.params.id;
    let courses = getCourses();
    
    // Den Index des Kurses im Array finden
    const courseIndex = courses.findIndex(c => c.id === courseId);
    
    if (courseIndex !== -1) {
        const { name, style, level, ageGroup, weekday, time, startDate, maxParticipants, status } = req.body;
        
        // Den bestehenden Kurs mit den neuen Werten überschreiben
        courses[courseIndex] = {
            ...courses[courseIndex], // Behält alte Werte (wie z.B. die ID und bookedParticipants)
            name: name,
            style: style,
            level: level,
            ageGroup: ageGroup,
            weekday: weekday,
            time: time,
            startDate: startDate,
            maxParticipants: parseInt(maxParticipants) || 0,
            status: status // Hier kann der Admin den Status jetzt auf active/inactive setzen
        };
        
        try {
            // In die JSON-Datei schreiben
            fs.writeFileSync(dataFilePath, JSON.stringify(courses, null, 4), 'utf-8');
            res.redirect('/admin?updated=true');
        } catch (error) {
            console.error('Fehler beim Updaten des Kurses:', error);
            res.status(500).send('❌ Fehler beim Aktualisieren des Kurses');
        }
    } else {
        res.status(404).send('❌ Kurs nicht gefunden');
    }
});


module.exports = router;
