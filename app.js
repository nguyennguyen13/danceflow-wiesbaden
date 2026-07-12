// app.js - DanceFlow Wiesbaden
// Hauptserver der Anwendung – Konfiguration, Middleware und Routen

// Lade Umgebungsvariablen aus .env
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const logger = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));

// Session
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret', // Geheimschlüssel für Session-Cookie
    resave: false, // Session nur speichern, wenn sich etwas ändert
    saveUninitialized: false, // Keine leeren Sessions speichern
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 Stunden gültig
}));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// User-Objekt für alle Views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.currentPath = req.path;
    next();
});


// Routes
const apiRouter = require('./routes/api');  
const pagesRouter = require('./routes/pages');
const coursesRouter = require('./routes/courses');
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');     

app.use('/api', apiRouter);
app.use('/', pagesRouter);
app.use('/', coursesRouter);
app.use('/', authRouter);
app.use('/admin', adminRouter); // Nur für Administratoren (geschützt)

// Seite nicht gefunden
app.use((req, res) => {
    res.status(404).send('Seite nicht gefunden');
});

// Interner Serverfehler
app.use((err, req, res, next) => {
    console.error('Server Error:', err.stack);
    res.status(500).send('Server Fehler');
});

// Server starten
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server läuft auf http://localhost:${PORT}`);
    });
}

module.exports = app;