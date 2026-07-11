// app.js - DanceFlow Wiesbaden
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== MIDDLEWARE =====
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));

// ===== SESSION =====
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
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
const pagesRouter = require('./routes/pages');
app.use('/', pagesRouter);

// Sobald Person 2, 3, 4 ihre Router fertig haben, hier ergänzen:
const coursesRouter = require('./routes/courses');     // Person 2
const authRouter = require('./routes/auth');          // Person 3
const adminRouter = require('./routes/admin');        // Person 4
//const apiRouter = require('./routes/api');            // Person 4
app.use('/', coursesRouter);
app.use('/', authRouter);
app.use('/admin', adminRouter);
//app.use('/api', apiRouter);

// ===== 404 =====
app.use((req, res) => {
    res.status(404).send('❌ Seite nicht gefunden');
});

// ===== ERROR =====
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err.stack);
    res.status(500).send('❌ Server Fehler');
});

// ===== SERVER START =====
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`✅ Server läuft auf http://localhost:${PORT}`);
    });
}

module.exports = app;
