/** Regex für E-Mail-Validierung */
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

/** Regex für Username-Validierung (3-20 Zeichen, nur Buchstaben, Zahlen, Unterstrich) */
const USERNAME_REGEX = /^[A-Za-z0-9_]{3,20}$/;

/**
 * JS Clientseitige Logik für Login/Register
 */
function togglePasswordVisibility(inputId, checkbox) {
    const input = document.getElementById(inputId);
    if (!input) return;

    if (checkbox.checked) {
        // Passwort anzeigen
        input.type = 'text';
    } else {
        // Passwort ausblenden
        input.type = 'password';
    }
}

/**
 * Versteckt alle Nachrichten auf der Seite
 */
function hideAllMessages() {
    document.querySelectorAll('.message').forEach(el => {
        el.style.display = 'none';
        el.textContent = '';
    });
}

// Leert alle Eingabefelder beim Laden der Seite
document.addEventListener('DOMContentLoaded', function () {
    // Alle relevanten Input-Felder leeren
    const inputs = [
        'loginInput', 'loginPassword',
        'regUsername', 'regName', 'regEmail', 'regPassword'
    ];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
});

const loginScreen = document.getElementById('loginScreen');
const registerScreen = document.getElementById('registerScreen');
const showRegisterLink = document.getElementById('showRegisterLink');
const showLoginLink = document.getElementById('showLoginLink');

// Wechselt zum Registrierungs-Bildschirm
showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginScreen.style.display = 'none';
    registerScreen.style.display = 'block';
    document.title = 'DanceFlow Wiesbaden - Registrieren';
    hideAllMessages();
});

// Wechselt zum Login-Bildschirm
showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    registerScreen.style.display = 'none';
    loginScreen.style.display = 'block';
    document.title = 'DanceFlow Wiesbaden - Anmeldung';
    hideAllMessages();
});

/**
 * Zeigt eine Nachricht im angegebenen Element an
 */
function showMessage(elementId, text, type = 'error') {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = text;
    el.className = 'message ' + type;
    el.style.display = 'block';
}

// Validierung Login

const loginForm = document.getElementById('loginForm');
const loginMsg = document.getElementById('loginMessage');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const login = document.getElementById('loginInput').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    // Prüft, ob Login-Feld eingegeben ist
    if (!login) {
        showMessage('loginMessage', 'Bitte Email oder Username eingeben', 'error');
        return;
    }
    // Prüft, ob Passwort-Feld eingegeben ist
    if (!password) {
        showMessage('loginMessage', 'Bitte Passwort eingeben', 'error');
        return;
    }

    try {
        // Login-Anfrage an den Server senden
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login, password })
        });

        const data = await response.json();

        // Prüft, ob die Nachricht gültig ist, und sendet sie ab
        if (data.success) {
            showMessage('loginMessage', 'Login erfolgreich!', 'success');
            setTimeout(() => {
                window.location.href = data.redirect;
            }, 1000);
        } else {
            showMessage('loginMessage', (data.error || 'Login fehlgeschlagen'), 'error');
        }
    } catch (err) {
        showMessage('loginMessage', 'Netzwerkfehler – bitte versuchen Sie es später', 'error');
    }
});

// Validierung Registrierung

const registerForm = document.getElementById('registerForm');
const registerMsg = document.getElementById('registerMessage');

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('regUsername').value.trim();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value.trim();

    // Prüft Username-Feld
    if (!username) {
        showMessage('registerMessage', 'Bitte Username eingeben', 'error');
        return;
    }
    // Prüft, ob das Format des Benutzernamens gültig ist
    if (!USERNAME_REGEX.test(username)) {
        showMessage('registerMessage', 'Username: 3-20 Zeichen, nur Buchstaben, Zahlen, _', 'error');
        return;
    }

    // Prüft Name-Feld
    if (!name) {
        showMessage('registerMessage', 'Bitte Name eingeben', 'error');
        return;
    }

    // Prüft E-Mail-Feld
    if (!email) {
        showMessage('registerMessage', 'Bitte E-Mail eingeben', 'error');
        return;
    }
    // Prüft E-Mail-Format mit Regex
    if (!EMAIL_REGEX.test(email)) {
        showMessage('registerMessage', 'Bitte eine gültige E-Mail eingeben (z.B. alice@mail.de)', 'error');
        return;
    }

    // Prüft, ob Passwort mindestens 6 Zeichen lang ist
    if (!password) {
        showMessage('registerMessage', 'Bitte Passwort eingeben', 'error');
        return;
    }
    if (password.length < 6) {
        showMessage('registerMessage', 'Passwort muss mindestens 6 Zeichen lang sein', 'error');
        return;
    }

    try {
        // Registrierungs-Anfrage an den Server senden
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, name, email, password })
        });

        const data = await response.json();

        // Prüft, ob die Nachricht gültig ist, und sendet sie ab
        if (data.success) {
            showMessage('registerMessage', '✅ ' + (data.message || 'Registrierung erfolgreich!'), 'success');
            registerForm.reset();

            // Automatische Weiterleitung zur Startseite nach 1.5 Sekunden
            setTimeout(() => {
                window.location.href = data.redirect || '/';
            }, 1500);
        } else {
            showMessage('registerMessage', (data.error || 'Registrierung fehlgeschlagen'), 'error');
        }
    } catch (err) {
        showMessage('registerMessage', 'Netzwerkfehler – bitte versuchen Sie es später', 'error');
    }
});

// Beim Drücken von Enter in einem Input-Feld wird das Formular abgesendet
document.querySelectorAll('#loginForm input, #registerForm input').forEach(input => {
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const form = input.closest('form');
            if (form) form.dispatchEvent(new Event('submit'));
        }
    });
});