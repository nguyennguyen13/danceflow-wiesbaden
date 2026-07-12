const request = require('supertest');
const app = require('../app');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const USERS_FILE = path.join(__dirname, '../data/users.json');
let originalUsers = '[]';

function setupTestUsers() {
    const adminHash = bcrypt.hashSync('admin123', 10);
    const customerHash = bcrypt.hashSync('alice123', 10);
    const testUsers = [
        { id: '1', username: 'admin', name: 'Admin', email: 'admin@danceflow.de', password: adminHash, role: 'admin' },
        { id: '2', username: 'alice', name: 'Alice', email: 'alice@mail.de', password: customerHash, role: 'customer' }
    ];
    fs.writeFileSync(USERS_FILE, JSON.stringify(testUsers, null, 2));
}

beforeAll(() => {
    if (fs.existsSync(USERS_FILE)) {
        originalUsers = fs.readFileSync(USERS_FILE, 'utf8');
    }
    setupTestUsers();
});

afterAll(() => {
    if (originalUsers !== '[]') {
        fs.writeFileSync(USERS_FILE, originalUsers);
    }
});

describe('Login Tests', () => {
    test('Login mit Email', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ login: 'admin@danceflow.de', password: 'admin123' });
        expect(res.statusCode).toBe(200); // 200 OK. Alles erfolgreich
        expect(res.body.success).toBe(true);
    });

    test('Login mit Username', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ login: 'admin', password: 'admin123' });
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });

    test('Login mit falschem Passwort', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ login: 'admin@danceflow.de', password: '123456' });
        expect(res.statusCode).toBe(401); // 401 Unauthorized. Falsche Zugangsdaten
        expect(res.body.error).toBeDefined();
    });

    test('Customer darf nicht /admin zugreifen', async () => {
        const agent = request.agent(app);
        await agent.post('/api/auth/login').send({ login: 'alice@mail.de', password: 'alice123' });
        const res = await agent.get('/admin');
        expect(res.statusCode).toBe(403); // 403 Forbidden. Keine Admin-Rechte
    });
});

describe('Registrierung Tests', () => {
    test('Registrierung erfolgreich', async () => {
        const mail = `test${Date.now()}@mail.de`;
        const res = await request(app)
            .post('/api/auth/register')
            .send({ username: `user${Date.now()}`, name: 'Max', email: mail, password: 'max123' });
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });

    test('Registrierung mit ungültiger Email', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ username: `user${Date.now()}`, name: 'Max', email: 'ungueltig', password: 'max123' });
        expect(res.statusCode).toBe(400); // 400 Bad Request. Fehlerhafte Anfrage
        expect(res.body.error).toMatch(/gültige E-Mail/i);
    });

    test('Registrierung mit bereits existierendem Username', async () => {
        const uniqueEmail = `test${Date.now()}@example.com`;
        const res = await request(app)
            .post('/api/auth/register')
            .send({ 
                username: 'alice',
                name: 'Test', 
                email: uniqueEmail, 
                password: 'test123' 
            });
        expect(res.statusCode).toBe(409); // 409 Conflict. Username bereits vergeben
        expect(res.body.error).toMatch(/Username/i);
    });
});