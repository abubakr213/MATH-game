
const USERS_KEY = "math_games_users";
const PLAYERS_KEY = "math_games_players";
const SESSION_KEY = "math_games_session";

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const recoveryForm = document.getElementById("recoveryForm");
const newPasswordForm = document.getElementById("newPasswordForm");

const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");
const authTabs = document.getElementById("authTabs");
const forgotBtn = document.getElementById("forgotBtn");
const backToLogin = document.getElementById("backToLogin");

let recoveryUser = null;

function getUsers() {
    try {
        const data = JSON.parse(localStorage.getItem(USERS_KEY));
        if (Array.isArray(data)) return data;
        if (data && typeof data === "object") return Object.values(data);
        return [];
    } catch {
        return [];
    }
}

function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getPlayers() {
    try {
        const data = JSON.parse(localStorage.getItem(PLAYERS_KEY));
        return data && typeof data === "object" ? data : {};
    } catch {
        return {};
    }
}

function savePlayers(players) {
    localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
}

function findUser(username) {
    return getUsers().find(user =>
        user.username?.toLowerCase() === username.toLowerCase()
    );
}

function showMessage(id, message, success = false) {
    const element = document.getElementById(id);
    element.textContent = message;
    element.style.color = success ? "#4ade80" : "#fb7185";
}

function showForm(formName) {
    loginForm.classList.add("hidden");
    registerForm.classList.add("hidden");
    recoveryForm.classList.add("hidden");
    newPasswordForm.classList.add("hidden");

    authTabs.classList.add("hidden");
    forgotBtn.classList.add("hidden");
    backToLogin.classList.remove("hidden");

    if (formName === "login") {
        loginForm.classList.remove("hidden");
        authTabs.classList.remove("hidden");
        forgotBtn.classList.remove("hidden");
        backToLogin.classList.add("hidden");
    }

    if (formName === "register") {
        registerForm.classList.remove("hidden");
        authTabs.classList.remove("hidden");
        backToLogin.classList.add("hidden");
    }

    if (formName === "recovery") {
        recoveryForm.classList.remove("hidden");
    }

    if (formName === "newPassword") {
        newPasswordForm.classList.remove("hidden");
    }
}

// Вкладка входа
loginTab.addEventListener("click", () => {
    loginTab.classList.add("active");
    registerTab.classList.remove("active");
    showForm("login");
});

// Вкладка регистрации
registerTab.addEventListener("click", () => {
    registerTab.classList.add("active");
    loginTab.classList.remove("active");
    showForm("register");
});

// Регистрация
registerForm.addEventListener("submit", event => {
    event.preventDefault();

    const username = document.getElementById("registerUsername").value.trim();
    const password = document.getElementById("registerPassword").value;
    const repeat = document.getElementById("repeatPassword").value;

    if (username.length < 3) {
        return showMessage("registerMessage", "Имя должно содержать минимум 3 символа.");
    }

    if (password.length < 8) {
        return showMessage("registerMessage", "Пароль должен содержать минимум 8 символов.");
    }

    if (password !== repeat) {
        return showMessage("registerMessage", "Пароли не совпадают.");
    }

    const users = getUsers();

    if (users.some(user =>
        user.username?.toLowerCase() === username.toLowerCase()
    )) {
        return showMessage("registerMessage", "Это имя пользователя уже занято.");
    }

    const newUser = {
        username,
        password,
        gold: 0,
        level: 1,
        xp: 0
    };

    users.push(newUser);
    saveUsers(users);

    showMessage("registerMessage", "Аккаунт успешно создан!", true);

    registerForm.reset();

    setTimeout(() => {
        document.getElementById("loginUsername").value = username;
        loginTab.click();
    }, 900);
});

// Вход
loginForm.addEventListener("submit", event => {
    event.preventDefault();

    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value;

    const user = findUser(username);

    if (!user || user.password !== password) {
        return showMessage("loginMessage", "Неверное имя пользователя или пароль.");
    }

    // Сохраняем сессию
    localStorage.setItem(SESSION_KEY, JSON.stringify({
        username: user.username
    }));

    window.location.href = "index.html";
});

// Забыли пароль
forgotBtn.addEventListener("click", () => {
    recoveryForm.reset();
    showForm("recovery");
});

// Проверка данных аккаунта
recoveryForm.addEventListener("submit", event => {
    event.preventDefault();

    const username = document.getElementById("recoveryUsername").value.trim();
    const gold = Number(document.getElementById("recoveryGold").value);
    const level = Number(document.getElementById("recoveryLevel").value);
    const xp = Number(document.getElementById("recoveryXP").value);

    const user = findUser(username);

    if (!user) {
        return showMessage("recoveryMessage", "Аккаунт не найден.");
    }

    const players = getPlayers();
    const player = players[user.username] || user;

    const correctGold = Number(player.gold ?? 0);
    const correctLevel = Number(player.level ?? 1);
    const correctXP = Number(player.xp ?? 0);

    if (
        gold !== correctGold ||
        level !== correctLevel ||
        xp !== correctXP
    ) {
        return showMessage(
            "recoveryMessage",
            "Данные не совпадают. Проверьте информацию."
        );
    }

    recoveryUser = user.username;

    showForm("newPassword");
});

// Установка нового пароля
newPasswordForm.addEventListener("submit", event => {
    event.preventDefault();

    const password = document.getElementById("newPassword").value;
    const repeat = document.getElementById("repeatNewPassword").value;

    if (password.length < 8) {
        return showMessage(
            "newPasswordMessage",
            "Пароль должен содержать минимум 8 символов."
        );
    }

    if (password !== repeat) {
        return showMessage(
            "newPasswordMessage",
            "Пароли не совпадают."
        );
    }

    const users = getUsers();
    const user = users.find(item => item.username === recoveryUser);

    if (!user) {
        return showMessage(
            "newPasswordMessage",
            "Аккаунт не найден. Начните восстановление заново."
        );
    }

    user.password = password;
    saveUsers(users);

    showMessage(
        "newPasswordMessage",
        "Пароль успешно изменён! Выполняется вход...",
        true
    );

    localStorage.setItem(SESSION_KEY, JSON.stringify({
        username: user.username
    }));

    setTimeout(() => {
        window.location.href = "index.html";
    }, 1000);
});

// Возврат ко входу
backToLogin.addEventListener("click", () => {
    loginTab.classList.add("active");
    registerTab.classList.remove("active");
    showForm("login");
});

showForm("login");
