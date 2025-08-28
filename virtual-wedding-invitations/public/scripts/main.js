const API_URL = '/api/invitados';

document.addEventListener('DOMContentLoaded', function() {
    // Obtener nombre del invitado desde el parámetro guest (codificado en base64)
    const urlParams = new URLSearchParams(window.location.search);
    let guestName = urlParams.get('guest');
    if (guestName) {
        try {
            guestName = decodeURIComponent(escape(atob(guestName)));
        } catch (e) {
            guestName = null;
        }
    }

    // Elementos
    const dearGuest = document.getElementById('dearGuest');
    const confirmYesButton = document.getElementById('confirmYesButton');
    const confirmNoButton = document.getElementById('confirmNoButton');
    const hospedajeButton = document.getElementById('hospedajeButton');
    const responseMessage = document.getElementById('responseMessage');
    const hospedajeContainer = document.getElementById('hospedajeContainer');

    // Personaliza el saludo
    if (guestName) {
        dearGuest.innerHTML = `Querido/a <i>${guestName}</i>:`;
        confirmYesButton.disabled = false;
        confirmNoButton.disabled = false;
        hospedajeButton.disabled = false;
    } else {
        dearGuest.textContent = "Querido/a invitado/a:";
        confirmYesButton.disabled = true;
        confirmNoButton.disabled = true;
        hospedajeButton.disabled = true;
    }

    // Estado local
    let asistencia = null;
    let hospedaje = false;

    // Inicialmente ocultar hospedaje
    hospedajeContainer.style.display = "none";

    // Botón de confirmar asistencia SÍ
    confirmYesButton.addEventListener('click', async () => {
        asistencia = true;
        hospedaje = false;
        confirmYesButton.classList.add('selected');
        confirmNoButton.classList.remove('selected');
        hospedajeButton.classList.remove('selected');
        responseMessage.textContent = "¡Gracias por confirmar tu asistencia!";
        hospedajeContainer.style.display = "block";
        await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre: guestName, asistencia: true, hospedaje: false })
        });
    });

    // Botón de confirmar asistencia NO
    confirmNoButton.addEventListener('click', async () => {
        asistencia = false;
        hospedaje = false;
        confirmNoButton.classList.add('selected');
        confirmYesButton.classList.remove('selected');
        hospedajeButton.classList.remove('selected');
        responseMessage.textContent = "Sentimos que no puedas asistir.";
        hospedajeContainer.style.display = "none";
        await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre: guestName, asistencia: false, hospedaje: false })
        });
    });

    // Botón de hospedaje (solo si asistencia es true)
    hospedajeButton.addEventListener('click', async () => {
        if (asistencia !== true) return;
        hospedaje = !hospedaje;
        if (hospedaje) {
            hospedajeButton.classList.add('selected');
            responseMessage.textContent = "¡Te reservamos hospedaje!";
        } else {
            hospedajeButton.classList.remove('selected');
            responseMessage.textContent = "Has cancelado la solicitud de hospedaje.";
        }
        await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre: guestName, asistencia: true, hospedaje })
        });
    });
});