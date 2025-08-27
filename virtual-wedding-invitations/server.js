const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

// Simulación de base de datos en memoria
let invitados = [];

app.use(cors());
app.use(express.json()); // <--- ESTA LÍNEA ES OBLIGATORIA

// Obtener todos los invitados
app.get('/api/invitados', (req, res) => {
    res.json(invitados);
});

// Crear o actualizar invitado
app.post('/api/invitados', (req, res) => {
    let { nombre, asistencia, descansa } = req.body;
    if (!nombre) {
        return res.status(400).json({ error: "El nombre es obligatorio" });
    }
    nombre = nombre.trim().toLowerCase();
    let invitado = invitados.find(i => i.nombre === nombre);
    if (!invitado) {
        invitado = { nombre, asistencia: null, descansa: null };
        invitados.push(invitado);
    }
    if (asistencia !== undefined) invitado.asistencia = asistencia;
    if (descansa !== undefined) invitado.descansa = descansa;
    res.json({ success: true, invitado });
});

// Borrar invitado
app.delete('/api/invitados/:nombre', (req, res) => {
    const nombre = req.params.nombre.trim().toLowerCase();
    invitados = invitados.filter(i => i.nombre !== nombre);
    res.json({ success: true });
});

// Borrar todos los invitados
app.delete('/api/invitados', (req, res) => {
    invitados = [];
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

