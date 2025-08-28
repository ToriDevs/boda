let invitados = [];

export default function handler(req, res) {
    // Parse body for Vercel (it may come as a string)
    let body = req.body;
    if (typeof body === 'string') {
        try {
            body = JSON.parse(body);
        } catch {
            body = {};
        }
    }

    if (req.method === 'GET') {
        res.status(200).json(invitados);
    } else if (req.method === 'POST') {
        let { nombre, asistencia, hospedaje } = body;
        if (!nombre) return res.status(400).json({ error: "El nombre es obligatorio" });
        nombre = nombre.trim().toLowerCase();
        let invitado = invitados.find(i => i.nombre === nombre);
        if (!invitado) {
            invitado = { nombre, asistencia: null, hospedaje: null };
            invitados.push(invitado);
        }
        if (asistencia !== undefined) invitado.asistencia = asistencia;
        if (hospedaje !== undefined) invitado.hospedaje = hospedaje;
        res.status(200).json({ success: true, invitado });
    } else if (req.method === 'DELETE') {
        if (req.query.nombre) {
            const nombre = req.query.nombre.trim().toLowerCase();
            invitados = invitados.filter(i => i.nombre !== nombre);
            res.status(200).json({ success: true });
        } else {
            invitados = [];
            res.status(200).json({ success: true });
        }
    } else {
        res.status(405).end();
    }
}