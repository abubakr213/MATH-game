
/* =====================================
   MATH GAMES — MAIN APP
   ===================================== */

const $ = id => document.getElementById(id);

const DB_KEY = "math_games_player_data";
const PROMO_KEY = "math_games_promocodes";
const SHOP_KEY = "math_games_shop_items";
const USERS_KEY = "math_games_users";

const DEFAULT_DATA = {
    username: "Player",
    login: "",
    gold: 100,
    xp: 0,
    level: 1,
    streak: 0,
    completed: 0,
    correct: 0,
    doneLevels: [],
    inventory: {},
    usedPromos: [],
    avatar: "👤"
};

function loadData() {
    try {
        const saved = JSON.parse(localStorage.getItem(DB_KEY));
        return { ...DEFAULT_DATA, ...(saved || {}) };
    } catch {
        return { ...DEFAULT_DATA };
    }
}

let player = loadData();

let currentCategory = "arithmetic";
let currentQuestions = [];
let questionIndex = 0;
let correctAnswers = 0;
let selectedAnswer = null;
let gameTimer = null;
let secondsLeft = 143;
let gameFinished = false;
let testCount = 10;
let currentLevel = 1;

/* =====================================
   SAVE AND UPDATE
   ===================================== */

function savePlayer() {
    localStorage.setItem(DB_KEY, JSON.stringify(player));
    updateInterface();
}

function updateInterface() {
    const values = {
        gold: player.gold,
        username: player.username,
        homeUsername: player.username,
        level: player.level + "-daraja",
        homeLevel: player.level,
        homeXP: player.xp,
        homeStreak: player.streak,
        homeDone: player.completed,
        sidebarXP: player.xp,
        profileName: player.username,
        profileLevel: player.level,
        profileGold: player.gold,
        profileXP: player.xp + " XP",
        statsLevel: player.level,
        statsXP: player.xp,
        statsDone: player.completed,
        statsStreak: player.streak
    };

    Object.entries(values).forEach(([id, value]) => {
        if ($(id)) $(id).textContent = value;
    });

    const xpProgress = player.xp % 100;

    if ($("sidebarXPBar")) {
        $("sidebarXPBar").style.width = xpProgress + "%";
    }

    updateSubjects();
    renderLevels();
    renderRanking();
    renderShop();
}

/* =====================================
   PAGE NAVIGATION
   ===================================== */

function openPage(page) {
    document.querySelectorAll(".page").forEach(section => {
        section.classList.remove("active");
    });

    if ($(page)) {
        $(page).classList.add("active");
    }

    document.querySelectorAll(".nav-btn").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.page === page
        );
    });
}

document.querySelectorAll(".nav-btn").forEach(button => {
    button.addEventListener("click", () => {
        openPage(button.dataset.page);
    });
});

document.querySelectorAll("[data-open]").forEach(button => {
    button.addEventListener("click", () => {
        openPage(button.dataset.open);
    });
});

/* =====================================
   SUBJECTS
   ===================================== */

const subjectRequirements = {
    arithmetic: 1,
    algebra: 1,
    tests: 100,
    geometry: 125,
    logic: 150
};

function updateSubjects() {
    document.querySelectorAll(".subject-btn").forEach(button => {
        const category = button.dataset.category;
        const required = subjectRequirements[category] || 1;
        const unlocked = player.level >= required;

        button.disabled = !unlocked;
        button.textContent = unlocked ? "Boshlash" : "🔒 Qulflangan";

        button.onclick = () => {
            if (!unlocked) {
                alert(`${required}-darajada ochiladi!`);
                return;
            }

            currentCategory = category;

            if (category === "tests") {
                openPage("testSetup");
            } else {
                startGame(category);
            }
        };
    });
}

/* =====================================
   LEVELS
   ===================================== */

function renderLevels() {
    const container = $("levelsList");
    if (!container) return;

    container.innerHTML = "";

    const unlockedCount = player.level;
    const completedCount = player.doneLevels.length;

    if ($("unlockedCount")) {
        $("unlockedCount").textContent = unlockedCount;
    }

    if ($("levelDoneCount")) {
        $("levelDoneCount").textContent = completedCount;
    }

    for (let i = 1; i <= 200; i++) {
        const unlocked = i <= player.level;
        const completed = player.doneLevels.includes(i);

        const button = document.createElement("button");
        button.className = "level-card";

        if (unlocked) button.classList.add("unlocked");
        else button.classList.add("locked");

        if (completed) button.classList.add("completed");

        button.innerHTML = `
            <span>${completed ? "✅" : unlocked ? "🏆" : "🔒"}</span>
            <b>${i}-daraja</b>
        `;

        button.disabled = !unlocked;

        button.addEventListener("click", () => {
            currentLevel = i;
            startGame("arithmetic", i);
        });

        container.appendChild(button);
    }
}

/* =====================================
   QUESTION GENERATOR
   ===================================== */

function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateQuestion(category, level) {
    let a, b, answer, text;

    const difficulty = Math.min(level, 20);

    if (category === "algebra") {
        const x = randomNumber(2, 15);
        const multiplier = randomNumber(2, 9);
        const extra = randomNumber(1, 15);

        answer = x;
        text = `${multiplier}x + ${extra} = ${multiplier * x + extra}. x = ?`;
    } else if (category === "geometry") {
        a = randomNumber(2, 15);
        b = randomNumber(2, 15);
        answer = a * b;
        text = `To‘g‘ri to‘rtburchak tomonlari ${a} va ${b}. Yuzi qancha?`;
    } else if (category === "logic") {
        a = randomNumber(2, 10);
        b = a * 2;
        answer = b + 2;
        text = `${a}, ${b}, ${answer - 2}, ?`;
    } else {
        const operation = ["+", "-", "×", "÷"][randomNumber(0, 3)];

        if (operation === "+") {
            a = randomNumber(5, 20 + difficulty * 3);
            b = randomNumber(2, 20 + difficulty * 2);
            answer = a + b;
        } else if (operation === "-") {
            a = randomNumber(10, 50 + difficulty * 3);
            b = randomNumber(1, a);
            answer = a - b;
        } else if (operation === "×") {
            a = randomNumber(2, 12);
            b = randomNumber(2, 12);
            answer = a * b;
        } else {
            b = randomNumber(2, 12);
            answer = randomNumber(2, 12);
            a = b * answer;
        }

        text = `${a} ${operation} ${b} = ?`;
    }

    const options = new Set([answer]);

    while (options.size < 4) {
        const difference = randomNumber(1, 10);
        const wrong = answer + (Math.random() > 0.5 ? difference : -difference);

        if (wrong >= 0 && wrong !== answer) {
            options.add(wrong);
        }
    }

    return {
        text,
        answer,
        options: [...options].sort(() => Math.random() - 0.5)
    };
}

/* =====================================
   GAME START
   ===================================== */

function startGame(category = "arithmetic", level = player.level) {
    clearInterval(gameTimer);

    currentCategory = category;
    currentLevel = level;

    questionIndex = 0;
    correctAnswers = 0;
    selectedAnswer = null;
    gameFinished = false;
    secondsLeft = 143;

    testCount = 10;

    currentQuestions = Array.from(
        { length: testCount },
        () => generateQuestion(category, level)
    );

    if ($("gameTitle")) {
        $("gameTitle").textContent = categoryNames[category] || "Matematika";
    }

    if ($("gameCategory")) {
        $("gameCategory").textContent = categoryNames[category] || category;
    }

    if ($("gameStory")) {
        $("gameStory").textContent =
            "Savollarga to‘g‘ri javob bering va mukofot oling!";
    }

    if ($("gameCharacter")) {
        $("gameCharacter").textContent = "🧙‍♂️";
    }

    if ($("nextQuestion")) {
        $("nextQuestion").hidden = true;
    }

    if ($("answerMessage")) {
        $("answerMessage").textContent = "";
    }

    openPage("game");
    showQuestion();
    startTimer();
}

const categoryNames = {
    arithmetic: "➗ Arifmetika",
    algebra: "📐 Algebra",
    geometry: "📏 Geometriya",
    logic: "🧠 Logika",
    tests: "📝 Testlar"
};

/* =====================================
   SHOW QUESTION
   ===================================== */

function showQuestion() {
    if (gameFinished) return;

    const question = currentQuestions[questionIndex];

    if (!question) {
        finishGame();
        return;
    }

    selectedAnswer = null;

    $("gameProgress").textContent =
        `${questionIndex + 1} / ${currentQuestions.length}`;

    $("question").textContent = question.text;

    $("progressBar").style.width =
        ((questionIndex / currentQuestions.length) * 100) + "%";

    $("answerMessage").textContent = "";
    $("nextQuestion").hidden = true;

    const answers = $("answers");
    answers.innerHTML = "";

    question.options.forEach(option => {
        const button = document.createElement("button");
        button.className = "answer-option";
        button.textContent = option;

        button.addEventListener("click", () => {
            chooseAnswer(button, option);
        });

        answers.appendChild(button);
    });
}

/* =====================================
   ANSWER CHECK
   ===================================== */

function chooseAnswer(button, answer) {
    if (selectedAnswer !== null || gameFinished) return;

    selectedAnswer = answer;

    const question = currentQuestions[questionIndex];
    const buttons = $("answers").querySelectorAll("button");

    buttons.forEach(item => {
        item.disabled = true;

        if (Number(item.textContent) === question.answer) {
            item.classList.add("correct");
        }
    });

    if (answer === question.answer) {
        correctAnswers++;
        $("answerMessage").textContent = "✅ To‘g‘ri javob!";
    } else {
        button.classList.add("wrong");
        $("answerMessage").textContent = "❌ Noto‘g‘ri javob!";
    }

    $("nextQuestion").hidden = false;
}

$("nextQuestion")?.addEventListener("click", () => {
    questionIndex++;

    if (questionIndex >= currentQuestions.length) {
        finishGame();
    } else {
        showQuestion();
    }
});

/* =====================================
   TIMER
   ===================================== */

function startTimer() {
    updateTimerText();

    gameTimer = setInterval(() => {
        secondsLeft--;

        updateTimerText();

        if (secondsLeft <= 0) {
            finishGame();
        }
    }, 1000);
}

function updateTimerText() {
    const min = Math.floor(secondsLeft / 60);
    const sec = secondsLeft % 60;

    const timerElement = $("gameTimer");

    if (timerElement) {
        timerElement.textContent =
            `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    }
}

/* =====================================
   FINISH GAME
   ===================================== */

function finishGame() {
    if (gameFinished) return;

    gameFinished = true;
    clearInterval(gameTimer);

    const total = currentQuestions.length;
    const reward = Math.max(10, Math.round(10 + correctAnswers * 7));
    const gainedXP = correctAnswers * 5;

    player.gold += reward;
    player.xp += gainedXP;
    player.completed++;
    player.correct += correctAnswers;

    if (correctAnswers >= 5) {
        player.doneLevels = [
            ...new Set([...player.doneLevels, currentLevel])
        ];

        if (currentLevel >= player.level) {
            player.level = currentLevel + 1;
        }
    }

    player.streak = correctAnswers >= 5 ? player.streak + 1 : 0;

    savePlayer();

    const message = correctAnswers >= 5
        ? "🎉 Tabriklaymiz! Keyingi daraja ochildi!"
        : "💪 Yana urinib ko‘ring! 5 ta to‘g‘ri javob kerak.";

    const result = `
        <div class="result-card">
            <h2>${message}</h2>
            <p>To‘g‘ri javoblar: ${correctAnswers} / ${total}</p>
            <p>🪙 Mukofot: ${reward} oltin</p>
            <p>⚡ Tajriba: ${gainedXP} XP</p>
            <button class="primary-btn" id="resultHome">Bosh sahifa</button>
            <button class="primary-btn" id="resultAgain">Qayta o‘ynash</button>
        </div>
    `;

    $("gameStory").innerHTML = result;
    $("question").textContent = "Test tugadi!";
    $("answers").innerHTML = "";
    $("nextQuestion").hidden = true;

    $("resultHome")?.addEventListener("click", () => openPage("home"));
    $("resultAgain")?.addEventListener("click", () =>
        startGame(currentCategory, currentLevel)
    );
}

/* =====================================
   TEST SETUP
   ===================================== */

$("testAudience")?.addEventListener("change", event => {
    const value = event.target.value;

    $("schoolGradeBox").hidden = value !== "school";
    $("teacherLevelBox").hidden = value !== "teacher";
    $("courseBox").hidden = value !== "university";
});

$("beginTest")?.addEventListener("click", () => {
    testCount = Number($("testCount").value) || 10;

    currentCategory = "tests";

    startGame("tests", player.level);

    currentQuestions = Array.from(
        { length: testCount },
        () => generateQuestion("arithmetic", player.level)
    );

    showQuestion();
});

/* =====================================
   SHOP — ADMIN ITEMS
   ===================================== */

function getShopItems() {
    const defaultItems = [
        {
            id: "freeze",
            name: "Muzlatkich",
            description: "Kunlik seriyani saqlab qoladi.",
            icon: "🧊",
            price: 150
        },
        {
            id: "avatar",
            name: "Yangi avatar",
            description: "Profil avataringizni yangilang.",
            icon: "🎭",
            price: 250
        },
        {
            id: "task",
            name: "Topshiriqlar to‘plami",
            description: "Qo‘shimcha topshiriqlar.",
            icon: "📦",
            price: 50
        }
    ];

    try {
        const adminItems = JSON.parse(localStorage.getItem(SHOP_KEY));

        if (Array.isArray(adminItems)) {
            return [...defaultItems, ...adminItems];
        }
    } catch {}

    return defaultItems;
}

function renderShop() {
    const container = document.querySelector("#shop .shop-grid");
    if (!container) return;

    const items = getShopItems();

    container.innerHTML = "";

    items.forEach(item => {
        const card = document.createElement("div");
        card.className = "shop-card";

        const icon = document.createElement("span");
        icon.textContent = item.icon || "🎁";

        const title = document.createElement("h2");
        title.textContent = item.name;

        const description = document.createElement("p");
        description.textContent = item.description || "";

        const price = document.createElement("b");
        price.textContent = `${Number(item.price)} 🪙`;

        const buy = document.createElement("button");
        buy.className = "buy-btn";
        buy.textContent = "Sotib olish";

        buy.addEventListener("click", () => {
            buyItem(item);
        });

        card.append(icon, title, description, price, buy);
        container.appendChild(card);
    });
}

function buyItem(item) {
    const price = Number(item.price);

    if (!Number.isFinite(price) || price < 0) {
        alert("Mahsulot narxi noto‘g‘ri!");
        return;
    }

    if (player.gold < price) {
        alert("Oltiningiz yetarli emas!");
        return;
    }

    player.gold -= price;

    if (!player.inventory[item.id]) {
        player.inventory[item.id] = 0;
    }

    player.inventory[item.id]++;

    savePlayer();

    if ($("shopMessage")) {
        $("shopMessage").textContent =
            `${item.name} sotib olindi! Jami: ${player.inventory[item.id]} ta.`;
    }
}

/* =====================================
   PROMO CODES
   ===================================== */

function createPromoArea() {
    const shop = $("shop");
    if (!shop || $("promoArea")) return;

    const area = document.createElement("div");
    area.id = "promoArea";
    area.className = "settings-card";

    area.innerHTML = `
        <h2>🎁 Promo-kod</h2>
        <p>Admin yoki ST Admin bergan promo-kodni kiriting.</p>
        <div class="promo-form">
            <input id="promoInput" type="text" placeholder="Promo-kodni kiriting">
            <button id="promoButton" class="primary-btn">Ishlatish</button>
        </div>
        <p id="promoMessage"></p>
    `;

    shop.appendChild(area);

    $("promoButton").addEventListener("click", redeemPromo);

    $("promoInput").addEventListener("keydown", event => {
        if (event.key === "Enter") redeemPromo();
    });
}

function getPromoList() {
    try {
        const list = JSON.parse(localStorage.getItem(PROMO_KEY));

        if (Array.isArray(list)) return list;

        if (list && typeof list === "object") {
            return Object.entries(list).map(([code, value]) => ({
                code,
                ...(typeof value === "object" ? value : { reward: value })
            }));
        }
    } catch {}

    return [];
}

function redeemPromo() {
    const input = $("promoInput");
    const message = $("promoMessage");

    const code = input.value.trim().toUpperCase();

    if (!code) {
        message.textContent = "Promo-kodni kiriting!";
        return;
    }

    if (player.usedPromos.includes(code)) {
        message.textContent = "Bu promo-kodni avval ishlatgansiz!";
        return;
    }

    const promo = getPromoList().find(item =>
        String(item.code || "").trim().toUpperCase() === code &&
        item.active !== false
    );

    if (!promo) {
        message.textContent = "Promo-kod topilmadi yoki faol emas!";
        return;
    }

    const reward = Number(promo.reward ?? promo.gold ?? 0);

    if (!Number.isFinite(reward) || reward <= 0) {
        message.textContent = "Promo-kod mukofoti noto‘g‘ri!";
        return;
    }

    player.gold += reward;
    player.usedPromos.push(code);

    savePlayer();

    input.value = "";

    message.textContent =
        `🎉 Muvaffaqiyatli! Balansingizga ${reward} oltin tanga qo‘shildi!`;
}

/* =====================================
   RANKING
   ===================================== */

function renderRanking() {
    const body = $("rankingList");
    if (!body) return;

    let users = [];

    try {
        const savedUsers = JSON.parse(localStorage.getItem(USERS_KEY));

        if (Array.isArray(savedUsers)) {
            users = savedUsers;
        }
    } catch {}

    const allPlayers = [
        {
            username: player.username,
            level: player.level,
            xp: player.xp
        },
        ...users.map(user => ({
            username: user.username || user.login || "Player",
            level: Number(user.level || 1),
            xp: Number(user.xp || 0)
        }))
    ];

    const unique = [...new Map(
        allPlayers.map(user => [user.username, user])
    ).values()];

    unique.sort((a, b) => b.xp - a.xp);

    body.innerHTML = "";

    unique.slice(0, 20).forEach((user, index) => {
        const row = document.createElement("tr");

        [index + 1, user.username, user.level, user.xp].forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        body.appendChild(row);
    });
}

/* =====================================
   PROFILE
   ===================================== */

$("saveProfileBtn")?.addEventListener("click", () => {
    const newName = $("editUsername").value.trim();
    const newLogin = $("editLogin").value.trim();

    if (newName) player.username = newName;
    if (newLogin) player.login = newLogin;

    savePlayer();

    $("profileMessage").textContent = "Profil saqlandi!";
});

$("changePasswordBtn")?.addEventListener("click", () => {
    const oldPassword = $("oldPassword").value;
    const newPassword = $("newPassword").value;
    const confirmPassword = $("confirmPassword").value;

    if (!oldPassword || !newPassword || !confirmPassword) {
        $("passwordMessage").textContent = "Barcha maydonlarni to‘ldiring.";
        return;
    }

    if (newPassword !== confirmPassword) {
        $("passwordMessage").textContent = "Yangi parollar mos emas.";
        return;
    }

    $("passwordMessage").textContent =
        "Parolni almashtirish login tizimi bilan ulanishi kerak.";
});

/* =====================================
   ADVENTURE
   ===================================== */

$("startAdventure")?.addEventListener("click", () => {
    startGame("arithmetic");
});

$("backToGamePage")?.addEventListener("click", () => {
    clearInterval(gameTimer);
    openPage("home");
});

$("backToRanking")?.addEventListener("click", () => {
    openPage("ranking");
});

/* =====================================
   THEME
   ===================================== */

$("themeBtn")?.addEventListener("click", () => {
    document.body.classList.toggle("light");

    const light = document.body.classList.contains("light");

    $("themeBtn").textContent = light ? "☀️" : "🌙";

    localStorage.setItem(
        "math_games_theme",
        light ? "light" : "dark"
    );
});

const savedTheme = localStorage.getItem("math_games_theme");

if (savedTheme === "light") {
    document.body.classList.add("light");

    if ($("themeBtn")) {
        $("themeBtn").textContent = "☀️";
    }
}

/* =====================================
   COLORS
   ===================================== */

document.querySelectorAll(".color-btn").forEach(button => {
    button.addEventListener("click", () => {
        const color = button.dataset.color;

        document.body.dataset.color = color;

        localStorage.setItem("math_games_color", color);
    });
});

const savedColor = localStorage.getItem("math_games_color");

if (savedColor) {
    document.body.dataset.color = savedColor;
}

/* =====================================
   LOGOUT
   ===================================== */

$("logoutBtn")?.addEventListener("click", () => {
    if (confirm("Hisobdan chiqmoqchimisiz?")) {
        sessionStorage.clear();
        window.location.href = "login.html";
    }
});

/* =====================================
   INITIALIZATION
   ===================================== */

createPromoArea();
updateInterface();
// ===============================
// UZBEKCHA - RUSCHA TIL TIZIMI
// ===============================

const translations = {
    "Bosh sahifa": "Главная",
    "Sarguzasht": "Приключение",
    "Darajalar": "Уровни",
    "Reyting": "Рейтинг",
    "Profil": "Профиль",
    "Statistika": "Статистика",
    "Do‘kon": "Магазин",
    "Do'kon": "Магазин",
    "Boshlash": "Начать",
    "Davom etish": "Продолжить",
    "Orqaga": "Назад",
    "Keyingi savol": "Следующий вопрос",
    "Tekshirish": "Проверить",
    "Saqlash": "Сохранить",
    "Bekor qilish": "Отмена",
    "Sotib olish": "Купить",
    "Oltin": "Золото",
    "Daraja": "Уровень",
    "Tajriba": "Опыт",
    "O‘yin": "Игра",
    "O'yin": "Игра",
    "Savol": "Вопрос",
    "Javob": "Ответ",
    "To‘g‘ri!": "Правильно!",
    "To'g'ri!": "Правильно!",
    "Noto‘g‘ri!": "Неправильно!",
    "Noto'g'ri!": "Неправильно!",
    "Ismingiz": "Ваше имя",
    "Login": "Логин",
    "Parol": "Пароль",
    "Eski parol": "Старый пароль",
    "Yangi parol": "Новый пароль",
    "Parolni tasdiqlash": "Подтвердить пароль",
    "Foydalanuvchi": "Пользователь",
    "Algebra": "Алгебра",
    "Arifmetika": "Арифметика",
    "Geometriya": "Геометрия",
    "Mantiq": "Логика",
    "Testlar": "Тесты",
    "Oson": "Лёгкий",
    "O‘rta": "Средний",
    "O'rta": "Средний",
    "Qiyin": "Сложный",
    "Sotib olindi!": "Куплено!",
    "Mablag‘ yetarli emas!": "Недостаточно средств!",
    "Mablag' yetarli emas!": "Недостаточно средств!",
    "Promo kod": "Промокод",
    "Promo kodni qo‘llash": "Применить промокод",
    "Promo kodni qo'llash": "Применить промокод",
    "Bepul": "Бесплатно",
    "Do‘kon": "Магазин",
    "Xush kelibsiz!": "Добро пожаловать!",
    "Sizning balansingizga 100 oltin tanga qo‘shildi": "На ваш баланс добавлено 100 золотых монет"
};

function translatePage(language) {
    const isRussian = language === "ru";

    // Oddiy matnlarni tarjima qilish
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT
    );

    let node;

    while (node = walker.nextNode()) {
        const original = node.nodeValue.trim();

        if (!original) continue;

        if (isRussian && translations[original]) {
            node.nodeValue = node.nodeValue.replace(
                original,
                translations[original]
            );
        } else if (!isRussian) {
            const originalText = Object.keys(translations).find(
                key => translations[key] === original
            );

            if (originalText) {
                node.nodeValue = node.nodeValue.replace(
                    original,
                    originalText
                );
            }
        }
    }

    // Input placeholder tarjimasi
    document.querySelectorAll("input, textarea").forEach(element => {
        const placeholder = element.getAttribute("placeholder");

        if (!element.dataset.uzPlaceholder && placeholder) {
            element.dataset.uzPlaceholder = placeholder;
        }

        const original = element.dataset.uzPlaceholder;

        if (original) {
            element.placeholder = isRussian
                ? (translations[original] || original)
                : original;
        }
    });

    // Select ichidagi variantlar
    document.querySelectorAll("select option").forEach(option => {
        if (!option.dataset.uzText) {
            option.dataset.uzText = option.textContent;
        }

        const original = option.dataset.uzText;

        option.textContent = isRussian
            ? (translations[original] || original)
            : original;
    });

    localStorage.setItem("math_games_language", language);
}

// Til tanlash
const languageSelect = document.getElementById("languageSelect");

if (languageSelect) {
    const savedLanguage =
        localStorage.getItem("math_games_language") || "uz";

    languageSelect.value = savedLanguage;

    translatePage(savedLanguage);

    languageSelect.addEventListener("change", function () {
        translatePage(this.value);
    });
}