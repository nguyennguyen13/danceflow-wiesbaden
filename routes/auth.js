/**
 * Backend & Authentifizierungsrouten (Login, Registrierung, Logout)
 *
 * Enthält:
 *  - GET  /login              -> rendert das Login-/Registrierungsformular
 *  - POST /api/auth/register  -> legt einen neuen Mitarbeiter-Account an (bcrypt-Hashing)
 *  - POST /api/auth/login     -> prüft Zugangsdaten, erstellt Session
 *  - POST /api/auth/logout    -> beendet die Session
 */

const express = require('express'); // Importiert das Express-Framework für Routing und Middleware
const bcrypt = require('bcryptjs'); // Importiert bcryptjs für sicheres Passwort-Hashing und -Vergleich
const router = express.Router(); // Erstellt einen neuen Router für auth-bezogene Routen
const path = require('path'); // Importiert das 'path'-Modul für plattformunabhängige Pfade
const fs = require('fs'); // Importiert das 'fs'-Modul zum Lesen/Schreiben von Dateien

/** Pfad zur Benutzer-Datenbank */
const USERS_FILE = path.join(__dirname, '../data/users.json');

/** Anzahl der Salt-Runden für bcrypt */
const SALT_ROUNDS = 10;

/** Regex für E-Mail-Validierung */
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

/** Regex für Username-Validierung (3-20 Zeichen, nur Buchstaben, Zahlen, Unterstrich) */
const USERNAME_REGEX = /^[A-Za-z0-9_]{3,20}$/;

// ----- Hilfsfunktionen für users.json -----

/**
 * Liest die Benutzerliste aus der lokalen JSON-Datei.
 * Falls die Datei nicht existiert oder fehlerhaft ist, wird ein leeres Array zurückgegeben.
 * @returns {Array<Object>} Ein Array von Benutzerobjekten.
 */
function ensureDataFile() {
    const dir = path.dirname(USERS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]', 'utf-8');
}

ensureDataFile();

function getUsers() {
    try {
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

/**
 * Speichert die übergebene Benutzerliste formatiert in der JSON-Datei.
 * @param {Array<Object>} users - Das Array der zu speichernden Benutzerobjekte.
 * @returns {void}
 */
function saveUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

/**
 * Initialisiert das System mit einem Standard-Admin-Benutzer,
 * falls die Benutzerliste aktuell komplett leer ist.
 * @returns {void}
 */
function initializeAdmin() {
    const users = getUsers();
    if (users.length) return;
    users.push({
        id: '1',
        username: 'admin',
        name: 'Admin',
        email: 'admin@danceflow.de',
        password: bcrypt.hashSync('admin123', SALT_ROUNDS),
        role: 'admin'
    });
    saveUsers(users);
    saveUsers(users);
    console.log('Admin-Benutzer wurde erstellt (admin/admin@danceflow.de und admin123)');
}

// Führt die Admin-Initialisierung beim Starten des Skripts aus
initializeAdmin();

/**
 * Zeigt die Login/Register-Seite an.
 * Falls der Benutzer bereits eingeloggt ist, erfolgt eine Weiterleitung basierend auf seiner Rolle.
 */
router.get('/login', (req, res) => {
    // Prüfen, ob der Benutzer bereits eingeloggt ist
    if (req.session.user) {
        if (req.session.user.role === 'admin') {
            // Admin wird zum Dashboard weitergeleitet, alle anderen zur Startseite
            return res.redirect('/admin');
        }
        return res.redirect('/');
    }
    res.render('login', { title: 'Anmelden' });
});

/**
 * Login mit Email oder Username.
 * Prüft Zugangsdaten und erstellt bei Erfolg eine Session.
 */
router.post('/api/auth/login', async (req, res) => {
    const { login, password } = req.body;
    // Validierung: Beide Felder müssen ausgefüllt sein
    if (!login || !password) {
        return res.status(400).json({ error: 'Bitte Login (E-Mail oder Username) und Passwort eingeben' });
    }

    // Benutzer in der Datenbank suchen
    const users = getUsers();
    const user = users.find(u => u.email === login || u.username === login);
    if (!user) {
        return res.status(401).json({ error: 'Ungültiger Login oder Passwort' });
    }

    // Passwort mit bcrypt vergleichen
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
        return res.status(401).json({ error: 'Ungültiger Login oder Passwort' });
    }

    // Session speichern
    req.session.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role
    };

    // Ziel-URL für die Weiterleitung nach erfolgreichem Login
    const redirectUrl = user.role === 'admin' ? '/admin' : '/'
    res.json({ success: true, redirect: redirectUrl });
});

/**
 * Registriert einen neuen Benutzer mit Username, Name, Email, Passwort.
 * Verschlüsselt das Passwort asynchron und speichert den neuen Benutzer standardmäßig als customer.
 * Validiert alle Felder und erstellt automatisch eine Session.
 */
router.post('/api/auth/register', async (req, res) => {
    const { username, name, email, password } = req.body;
    // Alle Felder müssen ausgefüllt sein
    if (!username || !name || !email || !password) {
        return res.status(400).json({ error: 'Alle Felder müssen ausgefüllt sein' });
    }

    // Email Format
    if (!EMAIL_REGEX.test(email)) {
        return res.status(400).json({
            error: 'Bitte gültige E-Mail eingeben (z.B. alice@mail.de)'
        });
    }

    // Username Format
    if (!USERNAME_REGEX.test(username)) {
        return res.status(400).json({
            error: 'Username: 3-20 Zeichen, nur Buchstaben, Zahlen, _'
        });
    }

    // Passwortlänge prüfen
    if (password.length < 6) {
        return res.status(400).json({
            error: 'Passwort muss mindestens 6 Zeichen lang sein'
        });
    }

    // Prüfen, ob die E-Mail bereits vergeben ist
    const users = getUsers();

    if (users.find(u => u.email === email)) {
        return res.status(409).json({ error: 'Diese E-Mail ist bereits registriert' });
    }

    // Prüfen, ob der Username bereits vergeben ist
    if (users.find(u => u.username === username)) {
        return res.status(409).json({ error: 'Dieser Username ist bereits vergeben' });
    }

    // Passwort hashen
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const newUser = {
        id: Date.now().toString(),
        username,
        name,
        email,
        password: hashedPassword,
        role: 'customer'   // Standardrolle für neue Benutzer
    };

    // Benutzer speichern
    users.push(newUser);
    saveUsers(users);

    // Automatischer Login
    req.session.user = {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
    };

    // Wenn ein Benutzer erfolgreich registriert wurde, kann er zur Startseite weitergeleitet werden
    res.json({
        success: true, message: 'Registrierung erfolgreich!',
        redirect: '/'
    });
});

/**
 * API-Endpoint zum Ausloggen des Benutzers.
 * Beendet die aktuelle Session des Benutzers.
 */
router.post('/api/auth/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: 'Logout fehlgeschlagen' });
        }
        res.json({ success: true, redirect: '/' });
    });
});

module.exports = router;