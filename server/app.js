const fs = require('fs');
const path = require('path');
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const publicRoutes = require('./routes/publicRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { ensureDefaultAdmin } = require('./utils/seedAdmin');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const port = Number(process.env.PORT || 5000);

const uploadsDir = path.join(__dirname, 'uploads');
const exportsDir = path.join(__dirname, 'exports');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(exportsDir)) fs.mkdirSync(exportsDir, { recursive: true });

app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    name: 'resume_parser_sid',
    secret: process.env.SESSION_SECRET || 'change_this_session_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 2
    }
  })
);

app.use('/api/resumes', publicRoutes);
app.use('/api/admin', adminRoutes);

const clientDir = path.join(__dirname, '..', 'client');
app.use(express.static(clientDir));

const pageMap = {
  '/': 'index.html',
  '/upload': 'upload.html',
  '/result': 'result.html',
  '/admin-login': 'admin-login.html',
  '/admin-dashboard': 'admin-dashboard.html',
  '/admin-resumes': 'admin-resumes.html',
  '/admin-resume-detail': 'admin-resume-detail.html'
};

app.get(Object.keys(pageMap), (req, res) => {
  return res.sendFile(path.join(clientDir, pageMap[req.path]));
});

app.use('/api', notFoundHandler);
app.use(errorHandler);

function startServerWithFallback(startPort, maxRetries = 10) {
  return new Promise((resolve, reject) => {
    const attemptListen = (candidatePort, retriesLeft) => {
      const server = app.listen(candidatePort, () => {
        console.log(`Server running on http://localhost:${candidatePort}`);
        resolve(server);
      });

      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE' && retriesLeft > 0) {
          const nextPort = candidatePort + 1;
          console.warn(`Port ${candidatePort} is in use. Retrying on port ${nextPort}...`);
          attemptListen(nextPort, retriesLeft - 1);
          return;
        }

        reject(err);
      });
    };

    attemptListen(startPort, maxRetries);
  });
}

async function bootstrap() {
  await connectDB();
  await ensureDefaultAdmin();
  await startServerWithFallback(port);
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
