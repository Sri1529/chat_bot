const { createClient } = require('redis');
const config = require('../config');

let client = null;

async function initialize() {
  try {
    const redisConfig = {
      socket: {
        host: config.redis.host,
        port: config.redis.port,
        reconnectStrategy: (retries) => Math.min(retries * 50, 1000)
      }
    };

    if (config.redis.password) {
      redisConfig.password = config.redis.password;
    }

    if (config.redis.url) {
      client = createClient({ url: config.redis.url });
    } else {
      client = createClient(redisConfig);
    }

    client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    client.on('connect', () => {
      console.log('Redis Client Connected');
    });

    client.on('ready', () => {
      console.log('Redis Client Ready');
    });

    client.on('end', () => {
      console.log('Redis Client Disconnected');
    });

    await client.connect();
    return client;
  } catch (error) {
    console.error('Failed to initialize Redis:', error);
    throw error;
  }
}

async function getSession(sessionId) {
  try {
    const sessionData = await client.get(`session:${sessionId}`);
    return sessionData ? JSON.parse(sessionData) : null;
  } catch (error) {
    console.error('Error getting session:', error);
    throw error;
  }
}

async function setSession(sessionId, sessionData) {
  try {
    const key = `session:${sessionId}`;
    await client.setEx(key, config.session.ttl, JSON.stringify(sessionData));
    return true;
  } catch (error) {
    console.error('Error setting session:', error);
    throw error;
  }
}

async function addMessageToSession(sessionId, message) {
  try {
    const session = await getSession(sessionId);
    if (!session) {
      // Create new session
      const newSession = {
        id: sessionId,
        messages: [message],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await setSession(sessionId, newSession);
      return newSession;
    }

    // Add message to existing session
    session.messages.push(message);
    session.updatedAt = new Date().toISOString();

    // Limit messages to prevent memory issues
    if (session.messages.length > config.session.maxMessages) {
      session.messages = session.messages.slice(-config.session.maxMessages);
    }

    await setSession(sessionId, session);
    return session;
  } catch (error) {
    console.error('Error adding message to session:', error);
    throw error;
  }
}

async function clearSession(sessionId) {
  try {
    await client.del(`session:${sessionId}`);
    return true;
  } catch (error) {
    console.error('Error clearing session:', error);
    throw error;
  }
}

async function getSessionHistory(sessionId) {
  try {
    const session = await getSession(sessionId);
    return session ? session.messages : [];
  } catch (error) {
    console.error('Error getting session history:', error);
    throw error;
  }
}

async function close() {
  if (client) {
    await client.quit();
    client = null;
  }
}

module.exports = {
  initialize,
  getSession,
  setSession,
  addMessageToSession,
  clearSession,
  getSessionHistory,
  close
};
