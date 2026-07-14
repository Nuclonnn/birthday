const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const app = express();

const TG_TOKEN = process.env.TG_BOT_TOKEN;
const TG_CHAT_ID = process.env.TG_CHAT_ID;

app.use(cookieParser());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- ФУНКЦИЯ ОТПРАВКИ (БЕЗ HTML, ЧТОБЫ НЕ ЛОМАЛОСЬ) ---
async function sendTelegram(text) {
    if (!TG_TOKEN || !TG_CHAT_ID) {
        console.log("⚠️ Не настроен Telegram (нет токена или ID)");
        return;
    }

    try {
        console.log(`[TG] Отправляю: ${text.substring(0, 30)}...`);
        
        // Используем fetch (нужна Node.js 18+)
        await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TG_CHAT_ID,
                text: text // Шлем как есть, без parse_mode
            })
        });
        console.log("[TG] Успешно.");
    } catch (e) {
        console.error("[TG] Ошибка отправки:", e.message);
    }
}

// --- ПОЛУЧЕНИЕ IP ---
function getClientInfo(req) {
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    // Очистка IP от мусора
    if (ip && ip.includes(',')) ip = ip.split(',')[0].trim();
    if (ip === '::1') ip = 'Localhost';
    
    const agent = req.get('User-Agent') || 'Unknown Device';
    return `IP: ${ip}\nDevice: ${agent}`;
}

// --- МАРШРУТЫ ---

// 1. ГЛАВНАЯ
app.get('/', (req, res) => {
    // Тут мы ничего не шлем, чтобы не спамить лишний раз
    const info = getClientInfo(req);
    
    // 2. Отправляем тебе в ТГ
    sendTelegram(`🚨 НАЖАТА КНОПКА ВХОД!\n${info}`);
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 2. ВХОД (ВОТ ТУТ ТЕПЕРЬ ОТПРАВКА ДАННЫХ)
app.post('/api/login', (req, res) => {
    // 1. Собираем инфо
    const info = getClientInfo(req);
    
    // 2. Отправляем тебе в ТГ
    sendTelegram(`🚨 НАЖАТА КНОПКА ВХОД!\n${info}`);
    
    // 3. Логиним пользователя
    res.cookie('user_role', 'guest', { maxAge: 900000, httpOnly: false });
    res.json({ success: true, usingEncryption:"BASE64 + Шифр цезаря + {Количество подарков под ёлкой}"});
});

// 3. ПРОВЕРКА ВЗЛОМА
app.get('/api/secret-santa-data', (req, res) => {
    let role = req.cookies.user_role;
    if (role.toLowerCase() === 'admin' || role === 'root' || role === 'superuser') {
        sendTelegram(`✅ УСПЕШНЫЙ ВЗЛОМ (Level 1 Passed)`);
        res.json({
            access: "GRANTED",
            message: "Доступ ADMIN подтвержден.",
            redirectUrl: "/level-2-matrix" 
        });
    } else {
        res.status(403).json({ access: "DENIED", error: "Нет прав.", hint: "Поменяй cookies." });
    }
});

// 4. МАТРИЦА
app.get('/level-2-matrix', (req, res) => {
    if (req.cookies.user_role.toLowerCase() !== 'admin') return res.redirect('/');
    sendTelegram(`🕵️ Уровень 2 (Headers)\n${getClientInfo(req)}`);
    res.set('X-Next-Level-Url', '/level-3-security');
    res.sendFile(path.join(__dirname, 'public', 'level2.html'));
});

// 5. BASE64
app.get('/level-3-security', (req, res) => {
    if (req.cookies.user_role.toLowerCase() !== 'admin') return res.redirect('/');
    sendTelegram(`🔐 Уровень 3 (Base64)\n${getClientInfo(req)}`);
    res.sendFile(path.join(__dirname, 'public', 'level3.html'));
});

app.post('/api/check-base64', (req, res) => {
    const userCode = req.body.code;
    if (userCode === "OPEN-THE-GATES") {
        sendTelegram(`🔓 КОД ВЕРНЫЙ! Идет к ёлке.\n${getClientInfo(req)}`);
        res.json({ success: true, redirectUrl: "/new-year-surprise" });
    } else {
        sendTelegram(`⚠️ Ошибка кода: ${userCode}`);
        res.json({ success: false });
    }
});

// 6. ФИНАЛ
app.get('/new-year-surprise', (req, res) => {
    sendTelegram(`🎄 ФИНАЛ! УРА!\n${getClientInfo(req)}`);
    res.sendFile(path.join(__dirname, 'public', 'final.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
