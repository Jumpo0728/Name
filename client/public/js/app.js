// State
let currentUser = JSON.parse(localStorage.getItem('user'));
let currentProject = null;
let currentFile = null;
let ws = null;
let crdt = null;
let editor = null;
let ignoreLocal = false;

// DOM Elements
const views = {
    auth: document.getElementById('auth-view'),
    dashboard: document.getElementById('dashboard-view'),
    editor: document.getElementById('editor-view')
};

// Init
function init() {
    if (currentUser) {
        showDashboard();
    } else {
        showAuth();
    }
}

function switchView(name) {
    Object.values(views).forEach(el => el.classList.add('hidden'));
    views[name].classList.remove('hidden');
}

// Auth Handlers
document.getElementById('login-form').onsubmit = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    try {
        const data = await api.login(email, password);
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        currentUser = data.user;
        showDashboard();
    } catch (err) {
        alert(err.message);
    }
};

document.getElementById('signup-form').onsubmit = async (e) => {
    e.preventDefault();
    const username = e.target.username.value;
    const email = e.target.email.value;
    const password = e.target.password.value;
    try {
        await api.signup(username, email, password);
        alert('Signup successful! Please login.');
    } catch (err) {
        alert(err.message);
    }
};

document.getElementById('logout-btn').onclick = async () => {
    await api.logout();
    localStorage.clear();
    location.reload();
};

// Dashboard
async function showDashboard() {
    switchView('dashboard');
    document.getElementById('username-display').textContent = currentUser.username;
    
    const projects = await api.getProjects();
    const list = document.getElementById('project-list');
    list.innerHTML = '';
    projects.forEach(p => {
        const div = document.createElement('div');
        div.className = 'project-card';
        div.textContent = p.name;
        div.onclick = () => openProject(p);
        list.appendChild(div);
    });
}

document.getElementById('new-project-btn').onclick = async () => {
    const name = prompt('Project Name:');
    if (name) {
        await api.createProject(name);
        showDashboard();
    }
};

// Project/Editor
async function openProject(project) {
    currentProject = project;
    switchView('editor');
    document.getElementById('project-name').textContent = project.name;
    
    // Load files
    const files = await api.getProjectFiles(project.id);
    renderFileList(files);
    
    if (files.length > 0) {
        openFile(files[0].id);
    }
}

function renderFileList(files) {
    const list = document.getElementById('file-list');
    list.innerHTML = '';
    files.forEach(f => {
        const div = document.createElement('div');
        div.textContent = f.path;
        div.className = currentFile === f.id ? 'active' : '';
        div.onclick = () => openFile(f.id);
        list.appendChild(div);
    });
}

async function openFile(fileId) {
    if (ws) ws.close();
    
    currentFile = fileId;
    const file = await api.getFile(currentProject.id, fileId);
    
    // Init CodeMirror if not exists
    if (!editor) {
        editor = CodeMirror(document.getElementById('editor-container'), {
            lineNumbers: true,
            theme: 'dracula',
            mode: 'javascript'
        });
        
        editor.on('change', (cm, change) => {
            if (ignoreLocal) return;
            handleLocalChange(change);
        });
    }
    
    // Set content (initial load, will be overwritten by CRDT sync)
    // Actually, we shouldn't set value yet if we are syncing.
    // Wait for WS init.
    editor.setValue('Loading...');
    
    connectWebSocket(fileId);
}

function connectWebSocket(fileId) {
    const token = localStorage.getItem('accessToken');
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    ws = new WebSocket(`${proto}://${location.host}?token=${token}&fileId=${fileId}`);
    
    ws.onopen = () => {
        console.log('Connected to sync server');
        if (!crdt) crdt = new CRDT(currentUser.id);
        
        while (offlineQueue.length > 0) {
            const op = offlineQueue.shift();
            ws.send(JSON.stringify({ type: 'op', op }));
        }
    };
    
    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        handleMessage(msg);
    };
    
    ws.onclose = () => {
        console.log('Disconnected');
    };
}

function handleMessage(msg) {
    if (msg.type === 'init') {
        // Apply all ops
        // Sort ops by some criteria? CRDT handles order mostly, but applying in creation order is safer?
        // Server sends `ops` list.
        msg.ops.forEach(op => {
             if (op.type === 'insert') crdt.remoteInsert(op.item);
             if (op.type === 'delete') crdt.remoteDelete(op.id);
        });
        
        refreshEditor();
        
    } else if (msg.type === 'op') {
        const op = msg.op;
        if (op.siteId === currentUser.id) return; // Ignore own echo
        
        if (op.type === 'insert') {
            crdt.remoteInsert(op.item);
            // Apply to editor
            const idx = getVisibleIndex(op.item.id);
            if (idx !== -1) {
                const pos = editor.posFromIndex(idx);
                ignoreLocal = true;
                editor.replaceRange(op.item.char, pos, pos);
                ignoreLocal = false;
            }
        } else if (op.type === 'delete') {
            const idx = getVisibleIndex(op.id); // Index BEFORE deletion
            crdt.remoteDelete(op.id);
            if (idx !== -1) {
                const pos1 = editor.posFromIndex(idx);
                const pos2 = editor.posFromIndex(idx + 1);
                ignoreLocal = true;
                editor.replaceRange('', pos1, pos2);
                ignoreLocal = false;
            }
        }
    }
}

function handleLocalChange(change) {
    // CM change: { from, to, text, removed }
    // Convert to linear index
    const index = editor.indexFromPos(change.from);
    
    // Deletions first
    const removedLen = change.removed.join('\n').length;
    if (removedLen > 0) {
        for (let i = 0; i < removedLen; i++) {
            // We delete the char at `index` repeatedly because after deletion the next char shifts to `index`
            // But CRDT needs ID.
            const op = crdt.localDelete(index);
            if (op) sendOp(op);
        }
    }
    
    // Insertions
    const text = change.text.join('\n');
    if (text.length > 0) {
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const opItem = crdt.localInsert(char, index + i);
            sendOp({ type: 'insert', item: opItem, siteId: currentUser.id });
        }
    }
}

const offlineQueue = [];

function sendOp(op) {
    if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify({ type: 'op', op }));
    } else {
        offlineQueue.push(op);
    }
}

function refreshEditor() {
    ignoreLocal = true;
    editor.setValue(crdt.getText());
    ignoreLocal = false;
}

function getVisibleIndex(id) {
    const visible = crdt.struct.filter(i => !i.deleted);
    return visible.findIndex(i => i.id === id);
}

// Console & Run
document.getElementById('run-btn').onclick = () => {
    const code = editor.getValue();
    const frame = document.getElementById('preview-frame');
    
    // Reset frame
    frame.src = 'about:blank';
    
    setTimeout(() => {
        const doc = frame.contentDocument || frame.contentWindow.document;
        doc.open();
        doc.write(`
            <script>
                // Hook console
                ['log', 'error', 'warn', 'info'].forEach(method => {
                    const old = console[method];
                    console[method] = function(...args) {
                        window.parent.postMessage({
                            type: 'console',
                            method: method,
                            args: args.map(a => String(a)) // Simple serialization
                        }, '*');
                        if (old) old.apply(console, args);
                    };
                });
                
                // Error handler
                window.onerror = function(msg, url, line) {
                    console.error(msg + ' (Line ' + line + ')');
                };
            </script>
            <script>
                ${code}
            </script>
        `);
        doc.close();
    }, 100);
};

document.getElementById('clear-console-btn').onclick = () => {
    document.getElementById('console-panel').innerHTML = '';
};

window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'console') {
        const panel = document.getElementById('console-panel');
        const div = document.createElement('div');
        div.style.color = e.data.method === 'error' ? 'red' : e.data.method === 'warn' ? 'orange' : '#ccc';
        div.style.borderBottom = '1px solid #333';
        const time = new Date().toLocaleTimeString();
        div.textContent = `[${time}] [${e.data.method.toUpperCase()}] ${e.data.args.join(' ')}`;
        panel.appendChild(div);
        panel.scrollTop = panel.scrollHeight;
    }
});

// Global exposure for console
window.init = init;
init();
