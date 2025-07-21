
import express from 'express';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const DB_FILE = 'users.db';
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    console.error('❌ Erreur lors de la connexion à la base de données :', err.message);
    process.exit(1);
  }
});

// Endpoint de connexion
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email et mot de passe requis.' });
  }
  db.get('SELECT * FROM users WHERE email=?', [email], (err, row) => {
    if (err) {
      console.error('Erreur SQL login :', err.message);
      return res.status(500).json({ message: 'Erreur serveur.' });
    }
    if (!row) return res.status(401).json({ message: 'Identifiants invalides' });
    bcrypt.compare(password, row.password, (err, ok) => {
      if (err) {
        console.error('Erreur bcrypt :', err.message);
        return res.status(500).json({ message: 'Erreur serveur.' });
      }
      if (!ok) return res.status(401).json({ message: 'Identifiants invalides' });
      res.json({ email: row.email, role: row.role });
    });
  });
});

// Endpoint d'inscription
app.post('/api/register', (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email et mot de passe requis.' });
  }
  const userRole = role === 'admin' ? 'admin' : 'user';
  const hash = bcrypt.hashSync(password, 10);
  db.run('INSERT INTO users (email, password, role) VALUES (?,?,?)', [email, hash, userRole], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(409).json({ message: 'Email déjà utilisé.' });
      }
      console.error('Erreur SQL register :', err.message);
      return res.status(500).json({ message: 'Erreur serveur.' });
    }
    res.status(201).json({ id: this.lastID, email, role: userRole });
  });
});

// Endpoint pour lister les utilisateurs (admin seulement, simple démo)
app.get('/api/users', (req, res) => {
  db.all('SELECT id, email, role FROM users', [], (err, rows) => {
    if (err) {
      console.error('Erreur SQL users :', err.message);
      return res.status(500).json({ message: 'Erreur serveur.' });
    }
    res.json(rows);
  });
});

// Middleware 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route non trouvée.' });
});

// Gestion propre à l'arrêt du serveur
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Erreur lors de la fermeture de la base :', err.message);
    } else {
      console.log('Base de données fermée.');
    }
    process.exit(0);
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Serveur sur http://localhost:${PORT}`));