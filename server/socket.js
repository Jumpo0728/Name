const { WebSocketServer } = require('ws');
const { verifyToken } = require('./utils/auth');
const db = require('./db');
const redis = require('./redis');
const uuid = require('uuid');

function setupWebSocket(server) {
    const wss = new WebSocketServer({ server });

    // Active rooms state: fileId -> { clients: Set, ops: Array }
    // Ideally this state is in Redis for scaling, but for this demo we use local memory
    // and assume sticky sessions or single instance.
    // For production scaling, we'd use Redis Pub/Sub to broadcast ops across nodes.
    const rooms = new Map();

    wss.on('connection', async (ws, req) => {
        const url = new URL(req.url, 'http://localhost');
        const token = url.searchParams.get('token');
        const fileId = url.searchParams.get('fileId');

        if (!token || !fileId) {
            ws.close(1008, 'Authentication or FileId missing');
            return;
        }

        const user = verifyToken(token);
        if (!user) {
            ws.close(1008, 'Invalid Token');
            return;
        }

        ws.user = user;
        ws.fileId = fileId;
        ws.id = uuid.v4(); // Connection ID

        // Join Room
        if (!rooms.has(fileId)) {
            rooms.set(fileId, { clients: new Set(), ops: [] });
            // TODO: Load existing ops from DB if needed
            await loadHistory(fileId, rooms.get(fileId));
        }
        const room = rooms.get(fileId);
        room.clients.add(ws);

        // Send initial state
        const initialMsg = {
            type: 'init',
            ops: room.ops,
            peerId: ws.id,
            user: user
        };
        ws.send(JSON.stringify(initialMsg));

        // Notify others
        broadcast(room, ws, {
            type: 'peer-join',
            peerId: ws.id,
            user: user
        });

        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                handleMessage(ws, room, data);
            } catch (e) {
                console.error('WS Error', e);
            }
        });

        ws.on('close', () => {
            room.clients.delete(ws);
            broadcast(room, ws, {
                type: 'peer-leave',
                peerId: ws.id
            });
            
            if (room.clients.size === 0) {
                // If room is empty, maybe clear memory after some time
                // For now keep it to cache hot files
                setTimeout(() => {
                    if (room.clients.size === 0) rooms.delete(fileId);
                }, 300000); // 5 mins
            }
        });
    });

    function broadcast(room, sender, data) {
        const msg = JSON.stringify(data);
        for (const client of room.clients) {
            if (client !== sender && client.readyState === 1) {
                client.send(msg);
            }
        }
    }

    function handleMessage(ws, room, data) {
        if (data.type === 'op') {
            // Apply Op
            room.ops.push(data.op);
            
            // Broadcast
            broadcast(room, ws, data);

            // Persist to DB (async)
            db.run(`INSERT INTO operations_log (file_id, op_data) VALUES (?, ?)`, 
                [ws.fileId, JSON.stringify(data.op)], 
                (err) => {
                    if (err) console.error('DB Log Error', err);
                }
            );
        } else if (data.type === 'cursor') {
            // Ephemeral, just broadcast
            broadcast(room, ws, data);
        } else if (data.type === 'save') {
             // Client sent a snapshot save request (optional explicit save)
             // In a real CRDT, we'd compute the string from ops on server, 
             // but here we trust the client to send the text for the 'content' column preview.
             if (data.content) {
                 db.run(`UPDATE files SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, 
                    [data.content, ws.fileId]);
             }
        }
    }

    async function loadHistory(fileId, roomState) {
        return new Promise((resolve) => {
            db.all(`SELECT op_data FROM operations_log WHERE file_id = ? ORDER BY id ASC`, [fileId], (err, rows) => {
                if (!err && rows) {
                    roomState.ops = rows.map(r => JSON.parse(r.op_data));
                }
                resolve();
            });
        });
    }
}

module.exports = setupWebSocket;
