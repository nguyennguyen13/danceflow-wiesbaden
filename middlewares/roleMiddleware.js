/**
 * Nur für Administratoren (role = 'admin')
 */
function requireAdmin(req, res, next) {
    if (req.session && req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    // Für API: 403
    if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(403).json({ error: 'Admin-Rechte erforderlich' });
    }
    // Für Web: HTML Fehlerseite
    res.status(403).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Zugriff verweigert</title></head>
        <body style="font-family:sans-serif; text-align:center; padding:50px; background:#191970; color:white;">
            <h1 style="color:#ff1e27;">Zugriff verweigert</h1>
            <p>Nur für Administratoren!</p>
            <p><a href="/" style="color:#ffe600;">Zurück zur Startseite</a></p>
        </body>
        </html>
    `);
}

/**
 * Erfordert allgemeine Anmeldung
 */
function requireAuth(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(401).json({ error: 'Bitte einloggen' });
    }
    res.redirect('/login');
}

module.exports = { requireAdmin, requireAuth };