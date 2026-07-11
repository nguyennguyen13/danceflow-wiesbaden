const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../app');

const messagesPath = path.join(__dirname, '..', 'data', 'messages.json');
const stylePath = path.join(__dirname, '..', 'public', 'css', 'style.css');

describe('GET / – Startseite', () => {
  it('antwortet mit Status 200 und liefert HTML aus', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
  });

  it('enthält den viewport-Meta-Tag (Voraussetzung für Responsiveness)', async () => {
    const res = await request(app).get('/');
    expect(res.text).toContain('name="viewport"');
  });

  it('bindet das globale Stylesheet ein', async () => {
    const res = await request(app).get('/');
    expect(res.text).toContain('/css/style.css');
  });
});

describe('GET / – Navigationslinks', () => {
  it('enthält Links zu Start, Kurse und Login/Dashboard', async () => {
    const res = await request(app).get('/');
    expect(res.text).toContain('href="/"');
    expect(res.text).toContain('href="/courses"');
    expect(res.text).toMatch(/href="\/login"|href="\/admin"/);
  });
});

describe('style.css – Responsiveness', () => {
  it('enthält mindestens eine Media Query für kleinere Bildschirme', () => {
    const css = fs.readFileSync(stylePath, 'utf-8');
    expect(css).toMatch(/@media\s*\(max-width/);
  });
});

describe('POST /api/contact – Formularabsendung', () => {
  let originalMessages;

  beforeAll(() => {
    originalMessages = fs.readFileSync(messagesPath, 'utf-8');
  });

  afterAll(() => {
    fs.writeFileSync(messagesPath, originalMessages);
  });

  it('speichert eine gültige Anfrage mit korrekter JSON-Struktur', async () => {
    const before = JSON.parse(fs.readFileSync(messagesPath, 'utf-8'));

    const res = await request(app)
      .post('/api/contact')
      .send({
        firstname: 'Test',
        lastname: 'Nutzer',
        course: 'salsa',
        partner: '',
        email: 'test@example.com',
        message: 'Testnachricht',
        confirm: 'on'
      });

    expect([200, 302]).toContain(res.statusCode);

    const after = JSON.parse(fs.readFileSync(messagesPath, 'utf-8'));
    expect(after.length).toBe(before.length + 1);

    const entry = after[after.length - 1];
    expect(entry).toHaveProperty('id');
    expect(entry).toHaveProperty('firstname', 'Test');
    expect(entry).toHaveProperty('lastname', 'Nutzer');
    expect(entry).toHaveProperty('course', 'salsa');
    expect(entry).toHaveProperty('email', 'test@example.com');
    expect(entry).toHaveProperty('message', 'Testnachricht');
    expect(entry).toHaveProperty('createdAt');
  });

  it('lehnt Anfragen ohne Pflichtfelder ab (z.B. fehlende E-Mail)', async () => {
    const before = JSON.parse(fs.readFileSync(messagesPath, 'utf-8'));

    const res = await request(app)
      .post('/api/contact')
      .send({
        firstname: 'Test',
        lastname: 'Nutzer',
        course: 'salsa',
        email: '',
        message: 'Testnachricht'
      });

    expect(res.statusCode).toBe(400);

    const after = JSON.parse(fs.readFileSync(messagesPath, 'utf-8'));
    expect(after.length).toBe(before.length);
  });
});