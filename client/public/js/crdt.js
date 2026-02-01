class CRDT {
    constructor(siteId) {
        this.siteId = siteId;
        this.struct = []; // Array of { char, pos, siteId, id: unique }
        this.tombstones = new Set();
    }

    // Initialize from snapshot
    fromSnapshot(struct) {
        this.struct = struct;
        // Rebuild tombstones if needed, or assume struct is clean?
        // For this demo, struct contains ALL ops (tombstones included) or just visible?
        // Better: struct contains ONLY visible chars with their IDs.
        // We will trust the server/peer to send a consistent state.
        // But for convergence, we need deleted items to properly position new inserts if they were concurrent.
        // Simplified: We assume low concurrency for the demo and sync full state.
        // Actually, let's keep it robust. Struct = all items including deleted (marked visible: false).
    }

    getSnapshot() {
        return this.struct;
    }

    getText() {
        return this.struct.filter(i => !i.deleted).map(i => i.char).join('');
    }

    localInsert(char, index) {
        // Find prev and next pos
        // The index is in the VISIBLE list.
        // We need to map visible index to structural index.
        const visibleItems = this.struct.map((item, i) => ({ ...item, originalIdx: i })).filter(i => !i.deleted);
        
        let prevPos = '';
        let nextPos = '';
        
        if (index === 0) {
            prevPos = ''; // Start
            nextPos = visibleItems.length > 0 ? visibleItems[0].pos : '';
        } else if (index >= visibleItems.length) {
            prevPos = visibleItems[visibleItems.length - 1].pos;
            nextPos = ''; // End
        } else {
            prevPos = visibleItems[index - 1].pos;
            nextPos = visibleItems[index].pos;
        }

        const newPos = this.allocPos(prevPos, nextPos);
        const item = {
            char,
            pos: newPos,
            siteId: this.siteId,
            id: this.siteId + ':' + Date.now() + Math.random().toString(36).substr(2, 5),
            deleted: false
        };

        this.apply(item);
        return item;
    }

    localDelete(index) {
        const visibleItems = this.struct.filter(i => !i.deleted);
        if (index < 0 || index >= visibleItems.length) return null;
        
        const item = visibleItems[index];
        item.deleted = true;
        return { id: item.id, type: 'delete' };
    }

    remoteInsert(item) {
        this.apply(item);
    }

    remoteDelete(id) {
        const item = this.struct.find(i => i.id === id);
        if (item) {
            item.deleted = true;
        }
    }

    apply(item) {
        // Binary search to find insertion point based on pos
        // Sort order: pos, then siteId
        
        // Check duplicate
        if (this.struct.some(i => i.id === item.id)) return;

        let low = 0;
        let high = this.struct.length;

        while (low < high) {
            const mid = (low + high) >>> 1;
            const c = this.compare(this.struct[mid], item);
            if (c < 0) {
                low = mid + 1;
            } else {
                high = mid;
            }
        }
        
        this.struct.splice(low, 0, item);
    }

    compare(a, b) {
        if (a.pos < b.pos) return -1;
        if (a.pos > b.pos) return 1;
        if (a.siteId < b.siteId) return -1;
        if (a.siteId > b.siteId) return 1;
        return 0;
    }

    // Fractional indexing logic
    allocPos(prev, next) {
        // prev and next are strings
        // We find a string between them.
        
        // Base charset for positions (ASCII printable)
        // 33 (!) to 126 (~)
        // We use a subset to be safe: 48(0) to 122(z)
        // Let's use Base64-like charset for density?
        // Simpler: digits 0-9 for simplicity in debugging.
        // Or full printable for efficiency.
        // Let's use explicit path: '1', '1.5'? No string comparison fails there '1.5' < '10'.
        // We need lexicographically comparable strings.
        // Chars: 0-9, A-Z, a-z.
        // '0' < '9' < 'A' < 'Z' < 'a' < 'z'.
        
        // To simplify, let's use a function that appends a middle char.
        // If prev='', next='a' -> 'M' (mid).
        // If prev='M', next='a' -> 'T' (between M and a? No M < a? 77 < 97. yes).
        
        const MIN = 32; // space
        const MAX = 126; // ~
        
        let p = prev || '';
        let n = next || '';
        
        let res = '';
        let i = 0;
        
        while (true) {
            const cp = p.charCodeAt(i) || MIN;
            const cn = n.charCodeAt(i) || MAX + 1; // If end of string, treat as MAX+1
            
            if (cn - cp > 1) {
                // We have space between chars
                // E.g. cp=65(A), cn=67(C) -> 66(B)
                // cp=65(A), cn=80(P) -> mid
                const mid = Math.floor((cp + cn) / 2);
                res += String.fromCharCode(mid);
                return res;
            } else if (cn - cp === 1) {
                // Consecutive chars, e.g. A, B.
                // We must append to p.
                res += String.fromCharCode(cp);
                // Next iteration we compare p[i+1] vs n[i+1] (which is effectively MIN vs MAX+1 if p ended)
                // Actually if n ends here (cn=MAX+1), then we are appending to p, and n is effectively infinite.
                // But we need strict < n.
                // If n ended (it was shorter), but we matched up to its length?
                // Wait, 'A' < 'AB'.
                // If prev='A', next='AB'.
                // i=0: A, A. Equal.
                // i=1: MIN, B.
                // MIN(32) vs B(66). Gap!
                // mid = (32+66)/2 = 49('1').
                // Res = 'A1'.
                // 'A' < 'A1' < 'AB'. Correct.
            } else {
                // cp === cn
                res += String.fromCharCode(cp);
            }
            i++;
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CRDT;
}
