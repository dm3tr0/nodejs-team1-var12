const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Налаштовуємо EJS як шаблонізатор
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Вказуємо папку public для роздачі статичних файлів (HTML, CSS, картинки)
app.use(express.static(path.join(__dirname, 'public')));

// "База даних" нашої бригади для демонстрації динамічного контенту
const brigadeMembers = {
    '1': { name: 'Дмитро Рябокінь', role: 'Frontend Developer', skills: ['HTML', 'CSS', 'JavaScript']},
    '2': { name: 'Дмитро Іваницький', role: 'Team Lead', skills: ['Git', 'NodeJS']},
    '3': { name: 'Анатолій', role: 'Frontend Developer', skills: ['HTML', 'CSS', 'JavaScript'] },
    '4': { name: 'Вʼячеслав', role: 'Frontend Developer', skills: ['HTML', 'CSS', 'JavaScript'] },
    '5': { name: 'Денис', role: 'Frontend Developer', skills: ['HTML', 'CSS', 'JavaScript'] },
};

// Динамічний маршрут (генерується через EJS)
app.get('/student/:id', (req, res) => {
    const student = brigadeMembers[req.params.id];
    
    if (student) {
        // Передаємо дані об'єкта student у шаблон views/student.ejs
        res.render('student', { student: student });
    } else {
        res.status(404).send('Студента не знайдено');
    }
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер працює! Відкрийте http://localhost:${PORT}`);
});