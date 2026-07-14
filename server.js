const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();

const STOREBOOK_CODE = 'postgres-books-dataaccess';
const SQL_AUTHOR = 'владимир сорокин';
const QUOTE_WORDS = 'хитрым';

const STOREBOOK_BOOKS = [
  {
    id: 'ab4aa344-278c-44aa-b4fa-f34a5d6d1001',
    title: 'Голубое сало',
    nameAuthor: 'Владимир Сорокин',
    nameGenre: 'postmodern',
    price: 1290,
    amount: 7,
    publishedYear: 1999
  },
  {
    id: 'ab4aa344-278c-44aa-b4fa-f34a5d6d1002',
    title: 'Generation "П"',
    nameAuthor: 'Виктор Пелевин',
    nameGenre: 'postmodern',
    price: 990,
    amount: 0,
    publishedYear: 1999
  },
  {
    id: 'ab4aa344-278c-44aa-b4fa-f34a5d6d1003',
    title: 'Пикник на обочине',
    nameAuthor: 'Аркадий и Борис Стругацкие',
    nameGenre: 'science fiction',
    price: 1180,
    amount: 4,
    publishedYear: 1972
  },
  {
    id: 'ab4aa344-278c-44aa-b4fa-f34a5d6d1004',
    title: '1984',
    nameAuthor: 'Джордж Оруэлл',
    nameGenre: 'antiutopia',
    price: 870,
    amount: 9,
    publishedYear: 1949
  },
  {
    id: 'ab4aa344-278c-44aa-b4fa-f34a5d6d1005',
    title: 'Мастер и Маргарита',
    nameAuthor: 'Михаил Булгаков',
    nameGenre: 'classic',
    price: 920,
    amount: 3,
    publishedYear: 1967
  },
  {
    id: 'ab4aa344-278c-44aa-b4fa-f34a5d6d1006',
    title: 'Лавр',
    nameAuthor: 'Евгений Водолазкин',
    nameGenre: 'historical fiction',
    price: 1350,
    amount: 5,
    publishedYear: 2012
  }
];

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

app.get('/api/storebook/profile', (req, res) => {
  res.set({
    'x-storebook-db': 'postgres',
    'x-storebook-layer': 'DataAccess',
    'x-storebook-source': 'github.com/egyr101/StoreBook'
  });
  res.json({
    service: 'StoreBook',
    route: '/Books/all',
    controller: 'Books',
    controllers: ['Books', 'Authors', 'Genres'],
    architecture: ['Controllers', 'BusinessLogic', 'DataAccess', 'Domain'],
    clue: 'key format: db-controller-layer'
  });
});

app.get('/api/storebook/books/all', (req, res) => {
  res.json(STOREBOOK_BOOKS);
});

app.post('/api/check-envelope', (req, res) => {
  const raw = String(req.body.code || '').trim().toLowerCase().replace(/\s+/g, '-');
  if (raw === STOREBOOK_CODE) {
    setStage(res, 2);
    return res.json({ success: true, redirectUrl: '/locker' });
  }
  return res.json({
    success: false,
    message: 'Ключ не сошелся. StoreBook у тебя перед глазами.'
  });
});

app.get('/locker', (req, res) => {
  if (stage(req) < 2) return res.redirect('/');
  res.sendFile(pages('level2.html'));
});

app.post('/api/check-lock', (req, res) => {
  if (stage(req) < 2) {
    return res.status(403).json({ success: false, message: 'Сначала разберись с API.' });
  }
  const author = String(req.body.author || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (author === SQL_AUTHOR) {
    setStage(res, 3);
    return res.json({ success: true, redirectUrl: '/library' });
  }
  return res.json({
    success: false,
    message: 'Запрос мысленно написан не совсем точно.'
  });
});

app.get('/library', (req, res) => {
  if (stage(req) < 3) return res.redirect('/');
  res.sendFile(pages('level3.html'));
});

app.post('/api/check-wish', (req, res) => {
  if (stage(req) < 3) {
    return res.status(403).json({ success: false, message: 'Сначала закончи с выборкой.' });
  }
  const quote = String(req.body.quote || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (quote === QUOTE_WORDS) {
    setStage(res, 4);
    return res.json({ success: true, redirectUrl: '/final' });
  }
  return res.json({
    success: false,
    message: 'Фраза узнаваемая, но сейчас нет.'
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
