const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao conectar com o banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite.');
        db.run(`
            CREATE TABLE IF NOT EXISTS ingressos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                email TEXT NOT NULL,
                telefone TEXT NOT NULL,
                forma_pagamento TEXT NOT NULL,
                status_pagamento TEXT NOT NULL,
                valor REAL NOT NULL,
                parcelas INTEGER,
                transaction_id TEXT,
                data_compra DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) {
                console.error('Erro ao criar tabela:', err.message);
            } else {
                console.log('Tabela ingressos verificada/criada.');
            }
        });
    }
});

module.exports = db;
