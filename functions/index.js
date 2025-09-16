// Importation des modules Firebase
const functions = require('firebase-functions');
const next = require('next');

// Crée une instance de l'application Next.js
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, conf: { distDir: '.next' } });
const handle = app.getRequestHandler();

// Préparation de l'application Next.js
// La préparation ne doit se faire qu'une seule fois.
// C'est pourquoi nous utilisons un singleton ou un cache.
let preparedApp;

if (process.env.NODE_ENV === 'production') {
  preparedApp = app.prepare().then(() => app);
}


// Définition de la fonction nextServer qui servira l'application Next.js
exports.nextServer = functions.https.onRequest(async (req, res) => {
  try {
    if (!preparedApp) {
      await app.prepare();
      preparedApp = app;
    }
    const nextApp = await preparedApp;
    return await nextApp.getRequestHandler()(req, res);
  } catch (err) {
    functions.logger.error("Error handling Next.js request", err);
    res.status(500).send("Internal Server Error");
  }
});
