/**
 * public/js/booking.js
 * Buchungs-Modal / Booking-Form mit Login-Prüfung
 * 
 * Unterstützt:
 * - Booking-Form in course-detail.ejs
 * - Booking-Modal in courses.ejs
 */

document.addEventListener('DOMContentLoaded', function() {
    const bookingForm = document.getElementById('bookingForm');

    if (!bookingForm) {
        console.warn('bookingForm nicht gefunden');
        return;
    }

    // Formular absenden
    bookingForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const courseId = document.getElementById('courseId')?.value;
        const participantName = document.getElementById('participantName')?.value.trim();
        const email = document.getElementById('email')?.value.trim();
        const isPartner = document.getElementById('isPartner')?.checked || false;
        const partnerName = document.getElementById('partnerName')?.value.trim() || '';
        const errorElement = document.getElementById('bookingError');
        const submitBtn = this.querySelector('button[type="submit"]');

        // Reset error
        if (errorElement) {
            errorElement.style.display = 'none';
            errorElement.textContent = '';
        }

        // Validierung
        if (!participantName) {
            if (errorElement) {
                errorElement.textContent = 'Bitte geben Sie Ihren Namen ein';
                errorElement.style.display = 'block';
            }
            return;
        }

        if (!email) {
            if (errorElement) {
                errorElement.textContent = 'Bitte geben Sie Ihre E-Mail-Adresse ein';
                errorElement.style.display = 'block';
            }
            return;
        }

        if (isPartner && !partnerName) {
            if (errorElement) {
                errorElement.textContent = 'Bitte geben Sie den Namen Ihres Partners ein';
                errorElement.style.display = 'block';
            }
            return;
        }

        // Data senden
        const data = {
            courseId: courseId,
            customerName: participantName,
            isPartner: isPartner,
            partnerName: partnerName,
            email: email
        };

        // Disable button
        submitBtn.disabled = true;
        submitBtn.textContent = 'Wird gesendet...';

        try {
            // Zu API senden
            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.status === 401) {
                alert(result.error || 'Bitte loggen Sie sich ein!');
                window.location.href = '/login';
                submitBtn.disabled = false;
                submitBtn.textContent = 'Verbindlich buchen';
                return;
            }

            // Block
            if (response.status === 409) {
                alert(result.error);
                submitBtn.disabled = false;
                submitBtn.textContent = 'Verbindlich buchen';
                return;
            }

            // Kurs nicht gefunden
            if (response.status === 404) {
                alert(result.error || 'Kurs nicht gefunden');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Verbindlich buchen';
                return;
            }

            // success
            if (result.success) {
                if (result.status === 'Warteliste') {
                    alert(result.message);
                } else {
                    alert(result.message);
                }

                window.location.href = '/courses';
                return;
            }

            if (errorElement) {
                errorElement.textContent = result.error || 'Buchung fehlgeschlagen';
                errorElement.style.display = 'block';
            }

            submitBtn.disabled = false;
            submitBtn.textContent = 'Verbindlich buchen';

        } catch (err) {
            console.error('Booking Fehler:', err);
            if (errorElement) {
                errorElement.textContent = 'Netzwerkfehler. Bitte versuchen Sie es später';
                errorElement.style.display = 'block';
            }
            submitBtn.disabled = false;
            submitBtn.textContent = 'Verbindlich buchen';
        }
    });
});