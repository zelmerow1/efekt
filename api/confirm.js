// api/confirm.js - Z PRZEŁĄCZNIKIEM ON/OFF
let sessions = {};
let isSystemOnline = true; // 🔥 GLOBALNY STATUS

module.exports = (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // ===== GET =====
    if (req.method === 'GET') {
        const session = req.query.session;
        const list = req.query.list;
        const status = req.query.status;

        // 🔥 SPRAWDŹ STATUS SYSTEMU
        if (status === 'true') {
            return res.status(200).json({ 
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
            return res.status(200).json({ 
                sessions: active,
                system_online: isSystemOnline
            });
        }

        if (session) {
            const data = sessions[session] || { code: '--' };
            return res.status(200).json({ 
                code: data.code || '--',
                system_online: isSystemOnline
            });
        }

        return res.status(200).json({ 
            status: 'ok',
            message: 'API działa!',
            system_online: isSystemOnline,
            sessions_count: Object.keys(sessions).length
        });
    }

    // ===== POST =====
    if (req.method === 'POST') {
        const { action, session, email, password, code, status } = req.body;

        // 🔥 ZMIEŃ STATUS SYSTEMU (TYLKO ADMIN)
        if (action === 'set_status') {
            if (status === 'on' || status === 'off') {
                isSystemOnline = (status === 'on');
                console.log(`🔄 Status systemu zmieniony na: ${isSystemOnline ? 'ON' : 'OFF'}`);
                return res.status(200).json({ 
                    success: true, 
                    online: isSystemOnline,
                    message: `System ${isSystemOnline ? 'włączony' : 'wyłączony'}`
                });
            }
            return res.status(400).json({ error: 'Nieprawidłowy status. Użyj "on" lub "off"' });
        }

        // 🔥 CREATE SESSION - TYLKO JEST ONLINE
        if (action === 'create') {
            if (!isSystemOnline) {
                return res.status(403).json({ 
                    error: 'System wyłączony',
                    message: 'System jest aktualnie wyłączony. Spróbuj później.'
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
            console.log('✅ Sesja utworzona:', session, email);
            return res.status(200).json({ 
                success: true, 
                session: session,
                message: 'Sesja utworzona!'
            });
        }

        if (action === 'set_code') {
            if (!sessions[session]) {
                return res.status(404).json({ error: 'Sesja nie istnieje' });
            }
            sessions[session].code = code;
            sessions[session].sent = false;
            console.log('✅ Kod ustawiony:', session, code);
            return res.status(200).json({ 
                success: true, 
                code: code,
                message: 'Kod ustawiony!'
            });
        }

        if (action === 'send_code') {
            if (!sessions[session]) {
                return res.status(404).json({ error: 'Sesja nie istnieje' });
            }
            sessions[session].sent = true;
            console.log('✅ Kod wysłany:', session, sessions[session].code);
            return res.status(200).json({ 
                success: true, 
                sent: true,
                message: 'Kod wysłany!'
            });
        }

        return res.status(400).json({ error: 'Nieznana akcja' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
};
