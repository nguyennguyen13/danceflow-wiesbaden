// app.js - DanceFlow Wiesbaden
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== MIDDLEWARE =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));

// ===== SESSION =====
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 Tag gültig
}));

// ===== VIEW ENGINE =====
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ===== GLOBAL VARIABLES =====
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.currentPath = req.path;
    next();
});



// ===== ROUTES =====

// Startseite
const pagesRouter = require('./routes/pages');
const apiRoutes = require('./routes/api');
app.use('/', pagesRouter);
app.use('/api', apiRoutes);

// Anmeldeseite
const authRouter = require('./routes/auth');
app.use('/', authRouter);

// Adminbereich
//const adminRouter = require('./routes/admin');
//app.use('/admin', adminRouter);

// API-Routen
//const apiRouter = require('./routes/api');
//app.use('/api', apiRouter);

// ===== 404 =====
app.use((req, res) => {
    res.status(404).send('Seite nicht gefunden');
});

// ===== ERROR =====
app.use((err, req, res, next) => {
    console.error('Server Error:', err.stack);
    res.status(500).send('Server Fehler');
});

// ===== SERVER START =====
app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});

module.exports = app;