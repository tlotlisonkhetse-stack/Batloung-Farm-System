const mysql = require("mysql2/promise");

require("dotenv").config();

// The free filess.io database allows only 5 connections at once.
// On Vercel every request can run in its own copy of the backend, so a normal
// connection pool would hold connections open and use them all up.
// Instead we open one connection per request and close it straight afterwards.

const config = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectTimeout: 10000
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Open a connection. If the database says "too many connections",
// wait a moment and try again instead of failing.
async function connect() {
    let lastError;

    for (let attempt = 0; attempt < 8; attempt++) {
        try {
            return await mysql.createConnection(config);
        } catch (error) {
            lastError = error;

            if (error.errno !== 1226 && error.code !== "ER_USER_LIMIT_REACHED") {
                throw error;
            }

            await sleep(250 + Math.random() * 250);
        }
    }

    throw lastError;
}

// One query: connect, run it, always close the connection.
async function run(method, ...args) {
    const connection = await connect();

    try {
        return await connection[method](...args);
    } finally {
        await connection.end().catch(() => {});
    }
}

const db = {
    execute: (...args) => run("execute", ...args),
    query: (...args) => run("query", ...args),

    // Used for transactions. connection.release() closes the connection.
    getConnection: async () => {
        const connection = await connect();
        connection.release = () => {
            connection.end().catch(() => {});
        };
        return connection;
    }
};

module.exports = db;