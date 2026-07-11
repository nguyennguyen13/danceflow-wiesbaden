const request = require('supertest');
const app = require('../app');

describe('Kursfilter', () => {
  test('zeigt nur aktive Kurse in der Kursübersicht', async () => {
    const response = await request(app).get('/courses');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Salsa Profi');
    expect(response.text).toContain('21.7.2026');
    expect(response.text).not.toContain('8.7.2026');
  });

  test('filtert nach Tanzstil und Level', async () => {
    const response = await request(app)
      .get('/courses')
      .query({ style: 'Salsa', level: 'advanced' });

    expect(response.status).toBe(200);
    expect(response.text).toContain('Salsa Profi');
    expect(response.text).not.toContain('Salsa Anfänger');
  });

  test('zeigt einen Hinweis, wenn ein Filter keine Treffer liefert', async () => {
    const response = await request(app)
      .get('/courses')
      .query({ style: 'Nicht vorhanden' });

    expect(response.status).toBe(200);
    expect(response.text).toContain('Für diese Auswahl gibt es derzeit keine aktiven Kurse');
  });
});
