const SUPABASE_URL = 'https://yvakismtvwvjxylkorye.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2YWtpc210dnd2anh5bGtvcnllIiwicm9zZSI6ImFub24iLCJpYXQiOjE3NTYzOTA5NTEsImV4cCI6MjA3MTk2Njk1MX0.zN-oDIZLBEzYQUKaYwNW0yX68_WvNvl-bIPW5sldaZI';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', async function() {
    // Obtener nombre desde la URL
    const params = new URLSearchParams(window.location.search);
    const guestParam = params.get('guest');
    let guestName = guestParam ? decodeURIComponent(escape(atob(guestParam))) : null;

    // Mostrar saludo personalizado
    const dearGuest = document.getElementById('dearGuest');
    if (guestName && dearGuest) {
        dearGuest.textContent = `Querido/a "${guestName}"`;
    }

    // Elementos
    const confirmYesButton = document.getElementById('confirmYesButton');
    const confirmNoButton = document.getElementById('confirmNoButton');
    const hospedajeButton = document.getElementById('hospedajeButton');
    const responseMessage = document.getElementById('responseMessage');
    const hospedajeContainer = document.getElementById('hospedajeContainer');

    // Estado local
    let asistencia = null;
    let hospedaje = false;
    let invitado = null;

    // Buscar invitado en Supabase
    if (guestName) {
        const { data } = await supabase.from('invitados').select('*').eq('nombre', guestName).maybeSingle();
        invitado = data;
    }

    // Personaliza el saludo
    if (guestName) {
        confirmYesButton.disabled = false;
        confirmNoButton.disabled = false;
        hospedajeButton.disabled = false;
    } else {
        confirmYesButton.disabled = true;
        confirmNoButton.disabled = true;
        hospedajeButton.disabled = true;
    }

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
        if (invitado) {
            await supabase.from('invitados').update({ asistencia: true, hospedaje: false }).eq('id', invitado.id);
        }
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
        if (invitado) {
            await supabase.from('invitados').update({ asistencia: false, hospedaje: false }).eq('id', invitado.id);
        }
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
        if (invitado) {
            await supabase.from('invitados').update({ hospedaje }).eq('id', invitado.id);
        }
    });
});