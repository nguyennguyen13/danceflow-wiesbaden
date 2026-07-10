const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Absoluter Pfad zu den JSON-Dateien
const dataFilePath = path.join(__dirname, '../data/courses.json');
const bookingsFilePath = path.join(__dirname, '../data/bookings.json');

// HILFSFUNKTION: Liest die Kurse bei jedem Request frisch ein
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

// HILFSFUNKTION: Liest die Buchungen frisch ein
const getBookings = () => {
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
};

// 1. GET: Übersicht aller Kurse (Admin-Hauptseite) mit Auto-Logik und Filtern
router.get('/', (req, res) => {
    let courses = getCourses();
    const bookings = getBookings();
    
    // Heutiges Datum holen (Format: YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];
    let dateiWurdeGeaendert = false;
    
        // --- AUTOMATISCHE LOGIK (LIVE-ZÄHLER MIT PARTNER-PRÜFUNG & AUTO-INAKTIV) ---
    courses = courses.map(course => {
        
        // Holt alle Buchungen, die zu diesem Kurs gehören
        const kursBuchungen = bookings.filter(b => b.courseId === course.id);
        
        // Zählt die Teilnehmer: 
        // Wenn ein partnerName existiert (nicht null, nicht leer), zählen wir 2, sonst 1.
        let echteTeilnehmerAnzahl = 0;
        kursBuchungen.forEach(b => {
            if (b.partnerName && b.partnerName.trim() !== '') {
                echteTeilnehmerAnzahl += 2; // Paar-Anmeldung
            } else {
                echteTeilnehmerAnzahl += 1; // Einzelanmeldung
            }
        });

        // Wenn die errechnete Zahl von der alten Zahl abweicht, updaten wir sie live
        if (course.bookedParticipants !== echteTeilnehmerAnzahl) {
            course.bookedParticipants = echteTeilnehmerAnzahl;
            dateiWurdeGeaendert = true;
        }

        // B) Wenn das Startdatum vor heute liegt und der Kurs noch aktiv ist -> inaktiv setzen
        if (course.startDate < today && course.status === 'active') {
            course.status = 'inactive';
            dateiWurdeGeaendert = true;
        }

        return course;
    });


    // Nur speichern, wenn sich im Hintergrund Werte verändert haben
    if (dateiWurdeGeaendert) {
        try {
            fs.writeFileSync(dataFilePath, JSON.stringify(courses, null, 4), 'utf-8');
        } catch (error) {
            console.error('Fehler beim automatischen Update der Kurse:', error);
        }
    }

    // --- FILTRATION & DROPDOWNS ---
    // Einzigartige Stile und Levels extrahieren (ohne Duplikate für die Dropdowns)
    const allStyles = [...new Set(courses.map(c => c.style))].filter(Boolean);
    const allLevels = [...new Set(courses.map(c => c.level))].filter(Boolean);

    // Filter aus der URL auslesen (?style=...&level=...)
    const { style, level } = req.query;
    let filteredCourses = courses;

    if (style && style !== '') {
        filteredCourses = filteredCourses.filter(c => c.style === style);
    }
    if (level && level !== '') {
        filteredCourses = filteredCourses.filter(c => c.level === level);
    }

    // Rendern mit allen benötigten Filter-Variablen
    res.render('admin', { 
        courses: filteredCourses,
        allStyles: allStyles,
        allLevels: allLevels,
        currentFilters: { style: style || '', level: level || '' },
        bookings: bookings
    }); 
});

// 2. GET: Formular zum Erstellen eines neuen Kurses anzeigen
router.get('/new-course', (req, res) => {
    const courses = getCourses();
    const allStyles = [...new Set(courses.map(c => c.style))].filter(Boolean);
    const allLevels = [...new Set(courses.map(c => c.level))].filter(Boolean);

    res.render('admin-form', { 
        course: null,
        allStyles: allStyles,
        allLevels: allLevels
    }); 
});

// 3. POST: Kurs speichern
router.post('/new-course', (req, res) => {
    const courses = getCourses();
    const { name, style, level, ageGroup, weekday, time, startDate, maxParticipants } = req.body;
    
    // Generiert die ID dynamisch anhand des echten eingegebenen Tanzstils (z.B. "bachata-101")
    const styleSlug = style ? style.trim().toLowerCase().replace(/[^a-z0-9]/g, '') : 'kurs';
    const newId = `${styleSlug}-${101 + courses.length}`;
    
    const newCourse = {
        id: newId, 
        name: name, 
        style: style, 
        level: level, 
        ageGroup: ageGroup, 
        weekday: weekday, 
        time: time, 
        startDate: startDate,
        maxParticipants: parseInt(maxParticipants) || 0,
        bookedParticipants: 0, 
        status: "active"
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
    
    const allStyles = [...new Set(courses.map(c => c.style))].filter(Boolean);
    const allLevels = [...new Set(courses.map(c => c.level))].filter(Boolean);
    
    // Rendert dasselbe Formular und übergibt den gefundenen Kurs + Dropdown-Optionen
    res.render('admin-form', { 
        course: courseToEdit,
        allStyles: allStyles,
        allLevels: allLevels
    });
});

// 6. POST: Die geänderten Kursdaten empfangen und in der JSON updaten
router.post('/edit-course/:id', (req, res) => {
    const courseId = req.params.id;
    let courses = getCourses();
    const bookings = getBookings();
    
    const courseIndex = courses.findIndex(c => c.id === courseId);
    
    if (courseIndex !== -1) {
        const { name, style, level, ageGroup, weekday, time, startDate, maxParticipants, status } = req.body;
        
        // Zählt die echten Buchungen für diesen Kurs, damit bookedParticipants beim Update nicht genullt wird
        const echteBuchungen = bookings.filter(b => b.courseId === courseId).length;

        courses[courseIndex] = {
            ...courses[courseIndex], 
            name: name,
            style: style,
            level: level,
            ageGroup: ageGroup,
            weekday: weekday,
            time: time,
            startDate: startDate,
            maxParticipants: parseInt(maxParticipants) || 0,
            bookedParticipants: echteBuchungen, // Live-Zähler mitspeichern
            status: status 
        };
        
        try {
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
