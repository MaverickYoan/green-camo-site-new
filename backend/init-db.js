
import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';

// Nom du fichier de base de données
const DB_FILE = 'users.db';

// Création/connexion à la base de données
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    console.error('❌ Erreur lors de la connexion à la base de données :', err.message);
    process.exit(1);
  }
});

db.serialize(() => {
  // Création de la table users si elle n'existe pas
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('user','admin')) NOT NULL
  );`, (err) => {
    if (err) {
      console.error('❌ Erreur lors de la création de la table users :', err.message);
      return;
    }
    console.log('✅ Table users prête.');
  });

  // Ajout d'utilisateurs par défaut (user et admin)
  const users = [
    { email: 'user@test.com', password: '123456', role: 'user' },
    { email: 'admin@test.com', password: 'admin123', role: 'admin' }
  ];

  const stmt = db.prepare('INSERT OR IGNORE INTO users (email, password, role) VALUES (?,?,?)');
  users.forEach(u => {
    const hash = bcrypt.hashSync(u.password, 10);
    stmt.run(u.email, hash, u.role, (err) => {
      if (err) {
        console.error(`❌ Erreur lors de l'insertion de ${u.email} :`, err.message);
      }
    });
  });
  stmt.finalize((err) => {
    if (err) {
      console.error('❌ Erreur lors de la finalisation de l’insertion :', err.message);
    } else {
      console.log('✅ Utilisateurs par défaut insérés (si non existants).');
    }
    // Fermeture propre de la base
    db.close((err) => {
      if (err) {
        console.error('❌ Erreur lors de la fermeture de la base :', err.message);
      } else {
        console.log('✅ Initialisation de la base de données terminée.');
      }
    });
  });
});