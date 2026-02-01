const redis = require('redis');

let client;
let isRedisAvailable = false;
const store = new Map(); // In-memory fallback

async function connect() {
    client = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    client.on('error', (err) => {
        // console.warn('Redis Client Error (using memory fallback):', err.message);
        isRedisAvailable = false;
    });

    try {
        await client.connect();
        isRedisAvailable = true;
        console.log('Connected to Redis');
    } catch (e) {
        console.warn('Failed to connect to Redis, using in-memory store.');
        isRedisAvailable = false;
    }
}

connect();

module.exports = {
    get: async (key) => {
        if (isRedisAvailable) return await client.get(key);
        return store.get(key);
    },
    set: async (key, value, options = {}) => {
        if (isRedisAvailable) return await client.set(key, value, options);
        store.set(key, value);
        if (options.EX) {
            setTimeout(() => store.delete(key), options.EX * 1000);
        }
    },
    del: async (key) => {
        if (isRedisAvailable) return await client.del(key);
        store.delete(key);
    },
    publish: async (channel, message) => {
        if (isRedisAvailable) return await client.publish(channel, message);
        // In-memory pub/sub could be implemented here for single-node
    },
    subscribe: async (channel, handler) => {
        if (isRedisAvailable) {
            const sub = client.duplicate();
            await sub.connect();
            await sub.subscribe(channel, handler);
            return sub;
        }
    },
    isAvailable: () => isRedisAvailable
};
