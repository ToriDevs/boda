const API_URL = '/api/invitados';

document.addEventListener('DOMContentLoaded', async function () {
    const urlParams = new URLSearchParams(window.location.search);
    const guestName = urlParams.get('guest')?.trim();
    const dearGuest = document.getElementById('dearGuest');
    const confirmButton = document.getElementById('confirmButton');
    const stayYes = document.getElementById('stayYes');
    const responseMessage = document.getElementById('responseMessage');

    // Personaliza el saludo
    if (guestName) {
        dearGuest.textContent = `Querido/a ${guestName}, ¡te esperamos con mucha ilusión!`;
    } else {
        dearGuest.textContent = "Querido/a invitado/a, ¡te esperamos con mucha ilusión!";
        confirmButton.disabled = true;
        stayYes.disabled = true;
    }

    // Botón de confirmar asistencia
    confirmButton.addEventListener('click', async () => {
        await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre: guestName, asistencia: true })
        });
        responseMessage.textContent = "¡Gracias por confirmar tu asistencia!";
    });

    // Botón de quedarse a dormir
    stayYes.addEventListener('click', async () => {
        await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre: guestName, descansa: true })
        });
        responseMessage.textContent = "¡Te reservamos estancia!";
    });
});