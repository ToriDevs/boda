const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

const SUPABASE_URL = 'https://yvakismtvwvjxylkorye.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2YWtpc210dnd2anh5bGtvcnllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzOTA5NTEsImV4cCI6MjA3MTk2Njk1MX0.zN-oDIZLBEzYQUKaYwNW0yX68_WvNvl-bIPW5sldaZI';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Listar todos los invitados
router.get('/', async (req, res) => {
    const { data, error } = await supabase
        .from('invitados')
        .select('*')
        .order('created_at', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// Añadir o actualizar invitado
router.post('/', async (req, res) => {
    const { nombre, asistencia, hospedaje } = req.body;
    if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });

    // Buscar si ya existe
    const { data: existing, error: findError } = await supabase
        .from('invitados')
        .select('*')
        .eq('nombre', nombre)
        .maybeSingle();

    if (findError) return res.status(500).json({ error: findError.message });

    if (existing) {
        // Actualizar
        const { error: updateError } = await supabase
            .from('invitados')
            .update({ asistencia, hospedaje })
            .eq('id', existing.id);
        if (updateError) return res.status(500).json({ error: updateError.message });
        return res.json({ ok: true, updated: true });
    } else {
        // Insertar
        const { error: insertError } = await supabase
            .from('invitados')
            .insert([{ nombre, asistencia, hospedaje }]);
        if (insertError) return res.status(500).json({ error: insertError.message });
        return res.json({ ok: true, created: true });
    }
});

// Eliminar invitado
router.delete('/', async (req, res) => {
    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
    const { error } = await supabase
        .from('invitados')
        .delete()
        .eq('nombre', nombre);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ ok: true });
});

module.exports = router;