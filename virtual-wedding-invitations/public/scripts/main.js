const API_URL = '/api/invitados';

document.addEventListener('DOMContentLoaded', async function () {
    const urlParams = new URLSearchParams(window.location.search);
    const guestName = urlParams.get('guest')?.trim();
    const dearGuest = document.getElementById('dearGuest');
    const confirmYesButton = document.getElementById('confirmYesButton');
    const confirmNoButton = document.getElementById('confirmNoButton');
    const hospedajeButton = document.getElementById('hospedajeButton');
    const responseMessage = document.getElementById('responseMessage');
    const hospedajeContainer = document.getElementById('hospedajeContainer');

    // Personaliza el saludo
    if (guestName) {
        dearGuest.textContent = `Querido/a ${guestName}, ¡te esperamos con mucha ilusión!`;
    } else {
        dearGuest.textContent = "Querido/a invitado/a, ¡te esperamos con mucha ilusión!";
        confirmYesButton.disabled = true;
        confirmNoButton.disabled = true;
        hospedajeButton.disabled = true;
    }

    // Estado local
    let asistencia = null;
    let hospedaje = null;

    // Botón de confirmar asistencia SÍ
    confirmYesButton.addEventListener('click', async () => {
        asistencia = true;
        hospedaje = null; // Se resetea hospedaje al elegir asistencia
        await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre: guestName, asistencia: true, hospedaje: null })
        });
        responseMessage.textContent = "¡Gracias por confirmar tu asistencia!";
        hospedajeContainer.style.display = "block";
        hospedajeButton.classList.remove('selected');
    });

    // Botón de confirmar asistencia NO
    confirmNoButton.addEventListener('click', async () => {
        asistencia = false;
        hospedaje = null;
        await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre: guestName, asistencia: false, hospedaje: null })
        });
        responseMessage.textContent = "¡Sentimos que no puedas asistir.";
        hospedajeContainer.style.display = "none";
        hospedajeButton.classList.remove('selected');
    });

    // Botón de hospedaje (solo si asistencia es true)
    hospedajeButton.addEventListener('click', async () => {
        if (asistencia !== true) return;
        hospedaje = !hospedaje;
        await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre: guestName, asistencia: true, hospedaje })
        });
        if (hospedaje) {
            responseMessage.textContent = "¡Te reservamos hospedaje!";
            hospedajeButton.classList.add('selected');
        } else {
            responseMessage.textContent = "Has cancelado la solicitud de hospedaje.";
            hospedajeButton.classList.remove('selected');
        }
    });

    // Inicialmente ocultar hospedaje
    hospedajeContainer.style.display = "none";
});