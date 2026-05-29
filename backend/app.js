require('dotenv').config();
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');

const app = express();

/* motore di template, uso ejs perché mi sembra più semplice degli altri */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../frontend/views'));

/* cartella pubblica per css, js e immagini caricate */
app.use(express.static(path.join(__dirname, '../frontend/public')));
app.use('/uploads', express.static(path.join(__dirname, '../frontend/public/uploads')));

/* serve per leggere i dati che arrivano dai form */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/* gestione della sessione utente, così rimane loggato anche dopo il refresh */
app.use(session({
  secret: process.env.SESSION_SECRET || 'portfolio_secret_key_2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 } /* scade dopo 24 ore */
}));

/* messaggi temporanei tipo "login riuscito" o "errore nel form" */
app.use(flash());

/* rendo l'utente disponibile in tutti i template così non lo devo passare ogni volta */
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

/* importo tutte le route dell'applicazione */
const authRoutes = require('./routes/auth');
const portfolioRoutes = require('./routes/portfolio');
const adminRoutes = require('./routes/admin');
const apiRoutes = require('./routes/api');

app.use('/', authRoutes);
app.use('/portfolio', portfolioRoutes);
app.use('/admin', adminRoutes);
app.use('/api', apiRoutes);

/* reindirizzo la home direttamente alla gallery */
app.get('/', (req, res) => {
  res.redirect('/gallery');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🎨 PortfolioAI running on http://localhost:${PORT}`);
});
