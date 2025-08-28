import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yvakismtvwvjxylkorye.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2YWtpc210dnd2anh5bGtvcnllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzOTA5NTEsImV4cCI6MjA3MTk2Njk1MX0.zN-oDIZLBEzYQUKaYwNW0yX68_WvNvl-bIPW5sldaZI';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    // Parse body for Vercel (it may come as a string)
    let body = req.body;
    if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
    }

    if (req.method === 'GET') {
        const { data, error } = await supabase.from('invitados').select('*');
        if (error) return res.status(500).json({ error: error.message });
        res.status(200).json(data);
    } else if (req.method === 'POST') {
        let { nombre, asistencia, hospedaje } = body;
        if (!nombre) return res.status(400).json({ error: "El nombre es obligatorio" });

        // No normalizar el nombre
        const { data, error } = await supabase
            .from('invitados')
            .upsert([{ nombre, asistencia, hospedaje }], { onConflict: ['nombre'] })
            .select();
        if (error) return res.status(500).json({ error: error.message });
        res.status(200).json({ success: true, invitado: data[0] });
    } else if (req.method === 'DELETE') {
        if (req.query.nombre) {
            const nombre = req.query.nombre;
            const { error } = await supabase.from('invitados').delete().eq('nombre', nombre);
            if (error) return res.status(500).json({ error: error.message });
            res.status(200).json({ success: true });
        } else {
            const { error } = await supabase.from('invitados').delete().neq('nombre', '');
            if (error) return res.status(500).json({ error: error.message });
            res.status(200).json({ success: true });
        }
    } else {
        res.status(405).end();
    }
}