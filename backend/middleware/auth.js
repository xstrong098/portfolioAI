/* verifica che l'utente abbia fatto il login prima di accedere alla pagina */
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  req.flash('error', 'Devi effettuare il login per accedere a questa pagina.');
  res.redirect('/login');
};

/* verifica che l'utente abbia i permessi da admin */
const isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  req.flash('error', 'Accesso negato. Area riservata agli amministratori.');
  res.redirect('/gallery');
};

/* se sei già loggato non ti faccio vedere login e register, ti rimando alla gallery */
const isGuest = (req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  res.redirect('/gallery');
};

module.exports = { isAuthenticated, isAdmin, isGuest };
