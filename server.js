const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();

const ENVELOPE_CODE = 'PRAVDA-ZDES';
const ALBUM_UNLOCK = 'off';
const WISH_WORD = 'tort';

const COOKIE_OPTS = { maxAge: 1000 * 60 * 60 * 6, httpOnly: false, sameSite: 'lax' };
const pages = (...parts) => path.join(__dirname, 'pages', ...parts);

app.use(cookieParser());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function stage(req) {
  return Number(req.cookies.quest_stage || 0);
}

function setStage(res, n) {
  res.cookie('quest_stage', String(n), COOKIE_OPTS);
}

app.get('/', (req, res) => {
  res.sendFile(pages('index.html'));
});

app.post('/api/check-envelope', (req, res) => {
  const raw = String(req.body.code || '').trim().toUpperCase().replace(/\s+/g, '-');
  if (raw === ENVELOPE_CODE) {
    setStage(res, 2);
    return res.json({ success: true, redirectUrl: '/album' });
  }
  return res.json({
    success: false,
    message: 'Мимо. Конверт так просто не сдаётся.'
  });
});

app.get('/album', (req, res) => {
  if (stage(req) < 2) return res.redirect('/');
  res.sendFile(pages('level2.html'));
});

app.post('/api/check-album', (req, res) => {
  if (stage(req) < 2) {
    return res.status(403).json({ success: false, message: 'Сначала разберись с конвертом.' });
  }
  const lock = String(req.body.lock || '').trim().toLowerCase();
  if (lock === ALBUM_UNLOCK) {
    setStage(res, 3);
    return res.json({ success: true, redirectUrl: '/cake' });
  }
  return res.json({
    success: false,
    message: 'Альбом всё ещё на замке. Покопайся глубже.'
  });
});

app.get('/cake', (req, res) => {
  if (stage(req) < 3) return res.redirect('/');
  res.sendFile(pages('level3.html'));
});

app.post('/api/check-wish', (req, res) => {
  if (stage(req) < 3) {
    return res.status(403).json({ success: false, message: 'Рановато загадывать.' });
  }
  const wish = String(req.body.wish || '').trim().toLowerCase();
  if (wish === WISH_WORD) {
    setStage(res, 4);
    return res.json({ success: true, redirectUrl: '/final' });
  }
  return res.json({
    success: false,
    message: 'Свечи даже не дрогнули. Попробуй другое желание.'
  });
});

app.get('/final', (req, res) => {
  if (stage(req) < 4) return res.redirect('/');
  res.sendFile(pages('final.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Birthday quest running on http://localhost:${PORT}`);
});
