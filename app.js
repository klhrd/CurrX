// State Management
const state = {
    expression: '',
    result: 0,
    fromCurrency: 'USD',
    toCurrency: 'TWD',
    exchangeRate: 32.5,
    apiSource: localStorage.getItem('apiSource') || 'frankfurter',
    precision: parseInt(localStorage.getItem('precision')) || 2,
    isDark: localStorage.getItem('theme') === 'dark',
    history: JSON.parse(localStorage.getItem('history')) || [],
    lastUpdated: localStorage.getItem('lastUpdated') || null
};

// API Configurations (Corrected based on example)
const API_CONFIGS = {
    frankfurter: {
        url: (from, to) => `https://api.frankfurter.app/latest?from=${from}&to=${to}`,
        getPath: (data, to) => data?.rates?.[to]
    },
    exchangerate: {
        url: (from) => `https://open.er-api.com/v6/latest/${from}`,
        getPath: (data, to) => data?.rates?.[to]
    },
    fawazahmed: {
        url: (from) => `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${from.toLowerCase()}.json`,
        getPath: (data, to, from) => data?.[from.toLowerCase()]?.[to.toLowerCase()]
    }
};

// DOM Elements
const elements = {
    refreshStatus: document.getElementById('refreshStatus'),
    refreshBtn: document.getElementById('refreshBtn'),
    menuBtn: document.getElementById('menuBtn'),
    closeMenuBtn: document.getElementById('closeMenuBtn'),
    menuOverlay: document.getElementById('menuOverlay'),
    sideMenu: document.getElementById('sideMenu'),
    currencyToggle: document.getElementById('currencyToggle'),
    fromCurrency: document.getElementById('fromCurrency'),
    toCurrency: document.getElementById('toCurrency'),
    expressionDisplay: document.getElementById('expressionDisplay'),
    fromValDisplay: document.getElementById('fromValDisplay'),
    toValDisplay: document.getElementById('toValDisplay'),
    fromUnit: document.getElementById('fromUnit'),
    toUnit: document.getElementById('toUnit'),
    precisionSelect: document.getElementById('precisionSelect'),
    apiSourceSelect: document.getElementById('apiSourceSelect'),
    themeCheckbox: document.getElementById('themeCheckbox'),
    historyBtn: document.getElementById('historyBtn'),
    historyOverlay: document.getElementById('historyOverlay'),
    historyContent: document.getElementById('historyContent'),
    closeHistoryBtn: document.getElementById('closeHistoryBtn'),
    historyList: document.getElementById('historyList'),
    clearHistoryBtn: document.getElementById('clearHistoryBtn'),
    shareBtn: document.getElementById('shareBtn')
};

// Initialize
function init() {
    lucide.createIcons();
    applyTheme();
    loadSettings();
    updateUI();
    fetchRates(false);
    renderHistory();
}

function loadSettings() {
    elements.precisionSelect.value = state.precision;
    elements.apiSourceSelect.value = state.apiSource;
    elements.themeCheckbox.checked = state.isDark;
}

function saveSettings() {
    localStorage.setItem('apiSource', state.apiSource);
    localStorage.setItem('precision', state.precision);
    localStorage.setItem('theme', state.isDark ? 'dark' : 'light');
    localStorage.setItem('history', JSON.stringify(state.history));
}

function applyTheme() {
    document.body.classList.toggle('dark-mode', state.isDark);
}

// Fetch Rates
async function fetchRates(force = true) {
    const now = Date.now();
    const cacheKey = `rates_${state.fromCurrency}_${state.toCurrency}`;
    const cachedData = JSON.parse(localStorage.getItem(cacheKey));

    if (!force && cachedData && (now - cachedData.timestamp < 3600000)) {
        state.exchangeRate = cachedData.rate;
        state.lastUpdated = cachedData.timestamp;
        updateStatus();
        calculateCurrency();
        return;
    }

    elements.refreshBtn.classList.add('animate-spin');
    elements.refreshStatus.innerHTML = '正在更新匯率...';

    try {
        const config = API_CONFIGS[state.apiSource];
        const url = config.url(state.fromCurrency, state.toCurrency);
        const response = await fetch(url);
        if (!response.ok) throw new Error('API Error');
        const data = await response.json();
        const rate = config.getPath(data, state.toCurrency, state.fromCurrency);

        if (rate) {
            state.exchangeRate = rate;
            state.lastUpdated = Date.now();
            localStorage.setItem(cacheKey, JSON.stringify({ rate, timestamp: state.lastUpdated }));
            updateStatus();
        } else {
            throw new Error('路徑解析失敗');
        }
    } catch (err) {
        console.error('Fetch failed:', err);
        elements.refreshStatus.innerHTML = '更新失敗<br>請稍後再試';
    } finally {
        elements.refreshBtn.classList.remove('animate-spin');
        calculateCurrency();
    }
}

function updateStatus() {
    if (!state.lastUpdated) return;
    const diff = Math.floor((Date.now() - state.lastUpdated) / 60000);
    const timeStr = diff < 1 ? '剛剛' : `${diff} 分鐘前`;
    elements.refreshStatus.innerHTML = `最後更新時間<br>${timeStr}`;
}

// Calculator
function handleInput(key) {
    if (key === 'AC') {
        state.expression = '';
        state.result = 0;
    } else if (key === 'BACK') {
        state.expression = state.expression.slice(0, -1);
    } else if (key === '=') {
        evaluateExpression(true);
        return;
    } else {
        const ops = ['+', '-', '*', '/', '.', '%'];
        const lastChar = state.expression.slice(-1);
        if (ops.includes(key) && ops.includes(lastChar)) {
            state.expression = state.expression.slice(0, -1) + key;
        } else {
            state.expression += key;
        }
    }
    evaluateExpression(false);
    updateUI();
}

function evaluateExpression(save = false) {
    if (!state.expression) {
        state.result = 0;
        return;
    }
    try {
        let clean = state.expression.replace(/×/g, '*').replace(/÷/g, '/');
        const res = math.evaluate(clean);
        if (typeof res === 'number') {
            state.result = res;
            if (save) {
                addToHistory(state.expression, state.result);
                state.expression = res.toString();
            }
        }
    } catch (e) {
        if (save) elements.expressionDisplay.innerHTML = '<span style="color:#e57373">格式錯誤</span>';
    }
    calculateCurrency();
}

function calculateCurrency() {
    elements.fromValDisplay.innerText = formatNumber(state.result);
    elements.toValDisplay.innerText = formatNumber(state.result * state.exchangeRate);
}

function formatNumber(num) {
    return Number(num.toFixed(state.precision)).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: state.precision
    });
}

function updateUI() {
    elements.expressionDisplay.innerText = state.expression;
    elements.fromCurrency.innerText = state.fromCurrency;
    elements.toCurrency.innerText = state.toCurrency;
    elements.fromUnit.innerText = state.fromCurrency;
    elements.toUnit.innerText = state.toCurrency;
}

// History
function addToHistory(exp, res) {
    state.history.unshift({ id: Date.now(), exp, res, from: state.fromCurrency, to: state.toCurrency, rate: state.exchangeRate });
    if (state.history.length > 20) state.history.pop();
    saveSettings();
    renderHistory();
}

function renderHistory() {
    elements.historyList.innerHTML = state.history.map(item => `
        <div class="history-card" onclick="loadHistoryItem(${item.id})">
            <div style="font-size:0.8rem; color:var(--text-secondary)">${item.exp} = ${item.res} ${item.from}</div>
            <div style="font-weight:600; display:flex; justify-content:space-between">
                <span>${formatNumber(item.res * item.rate)} ${item.to}</span>
                <span style="font-size:0.7rem; opacity:0.6">1:${item.rate.toFixed(2)}</span>
            </div>
        </div>
    `).join('') || '<div style="text-align:center; padding:40px; opacity:0.5">無紀錄</div>';
}

window.loadHistoryItem = (id) => {
    const item = state.history.find(i => i.id === id);
    if (item) {
        state.expression = item.res.toString();
        state.result = item.res;
        state.fromCurrency = item.from;
        state.toCurrency = item.to;
        state.exchangeRate = item.rate;
        updateUI();
        calculateCurrency();
        closeHistory();
    }
};

// Events
document.querySelectorAll('.key').forEach(btn => btn.addEventListener('click', () => {
    handleInput(btn.dataset.key);
    if (window.navigator.vibrate) window.navigator.vibrate(5);
}));

elements.refreshBtn.addEventListener('click', () => fetchRates(true));

elements.menuBtn.addEventListener('click', () => {
    elements.menuOverlay.style.display = 'block';
    setTimeout(() => elements.sideMenu.classList.add('active'), 10);
});

const closeMenu = () => {
    elements.sideMenu.classList.remove('active');
    setTimeout(() => elements.menuOverlay.style.display = 'none', 300);
};

elements.closeMenuBtn.addEventListener('click', closeMenu);
elements.menuOverlay.addEventListener('click', (e) => { if (e.target === elements.menuOverlay) closeMenu(); });

elements.currencyToggle.addEventListener('click', () => {
    [state.fromCurrency, state.toCurrency] = [state.toCurrency, state.fromCurrency];
    state.exchangeRate = 1 / state.exchangeRate;
    updateUI();
    fetchRates(false);
});

elements.precisionSelect.addEventListener('change', (e) => {
    state.precision = parseInt(e.target.value);
    saveSettings();
    calculateCurrency();
});

elements.apiSourceSelect.addEventListener('change', (e) => {
    state.apiSource = e.target.value;
    saveSettings();
    fetchRates(true);
});

elements.themeCheckbox.addEventListener('change', (e) => {
    state.isDark = e.target.checked;
    applyTheme();
    saveSettings();
});

elements.historyBtn.addEventListener('click', () => {
    closeMenu();
    elements.historyOverlay.style.display = 'flex';
    setTimeout(() => elements.historyContent.classList.add('active'), 10);
});

const closeHistory = () => {
    elements.historyContent.classList.remove('active');
    setTimeout(() => elements.historyOverlay.style.display = 'none', 300);
};

elements.closeHistoryBtn.addEventListener('click', closeHistory);
elements.clearHistoryBtn.addEventListener('click', () => { state.history = []; saveSettings(); renderHistory(); });

elements.shareBtn.addEventListener('click', () => {
    const text = `[CurrX] ${state.expression} = ${state.result} ${state.fromCurrency} -> ${formatNumber(state.result * state.exchangeRate)} ${state.toCurrency}`;
    if (navigator.share) navigator.share({ text }).catch(() => {});
    else navigator.clipboard.writeText(text).then(() => alert('已複製'));
});

init();