const CRDT = require('../client/public/js/crdt');

describe('CRDT', () => {
    let crdtA, crdtB;

    beforeEach(() => {
        crdtA = new CRDT('siteA');
        crdtB = new CRDT('siteB');
    });

    test('local insert should add item', () => {
        const item = crdtA.localInsert('A', 0);
        expect(crdtA.getText()).toBe('A');
        expect(item.char).toBe('A');
    });

    test('convergence on concurrent insert', () => {
        // Site A inserts 'A' at 0
        const opA = crdtA.localInsert('A', 0);
        
        // Site B inserts 'B' at 0 (concurrently)
        const opB = crdtB.localInsert('B', 0);

        // Sync
        crdtA.remoteInsert(opB);
        crdtB.remoteInsert(opA);

        expect(crdtA.getText()).toBe(crdtB.getText());
        // Ordering depends on ID sorting. 
        // Site IDs: 'siteA' vs 'siteB'.
        // Pos are likely same (derived from start/end).
        // So tie break by siteId.
    });

    test('delete should work', () => {
        crdtA.localInsert('A', 0);
        crdtA.localInsert('B', 1);
        expect(crdtA.getText()).toBe('AB');

        crdtA.localDelete(0);
        expect(crdtA.getText()).toBe('B');
    });
    
    test('convergence on mixed ops', () => {
        const op1 = crdtA.localInsert('H', 0);
        const op2 = crdtA.localInsert('e', 1);
        const op3 = crdtA.localInsert('l', 2);
        
        crdtB.remoteInsert(op1);
        crdtB.remoteInsert(op2);
        crdtB.remoteInsert(op3);
        
        expect(crdtB.getText()).toBe('Hel');
        
        // Concurrent insert
        const op4A = crdtA.localInsert('l', 3);
        const op4B = crdtB.localInsert('!', 3);
        
        crdtB.remoteInsert(op4A);
        crdtA.remoteInsert(op4B);
        
        expect(crdtA.getText()).toBe(crdtB.getText());
    });
});
