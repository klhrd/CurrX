// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(err => console.error('SW register failed:', err));
    });
}

// State Management
const state = {
    expression: '',
    result: 0,
    fromCurrency: 'USD',
    toCurrency: 'TWD',
    exchangeRate: 32.5, // Default/Fallback
    apiSource: localStorage.getItem('apiSource') || 'frankfurter',
    precision: parseInt(localStorage.getItem('precision')) || 2,
    isDark: localStorage.getItem('theme') === 'dark',
    history: JSON.parse(localStorage.getItem('history')) || [],
    lastUpdated: localStorage.getItem('lastUpdated') || null
};

// API Configurations
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

// Settings
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

// Theme
function applyTheme() {
    if (state.isDark) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
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
        }
    } catch (err) {
        console.error('Fetch failed:', err);
        elements.refreshStatus.innerHTML = '更新失敗<br>使用快取數據';
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

// Calculator Logic
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
        // Simple sanitization for display
        const lastChar = state.expression.slice(-1);
        const ops = ['+', '-', '*', '/', '.', '%'];
        if (ops.includes(key) && ops.includes(lastChar)) {
            state.expression = state.expression.slice(0, -1) + key;
        } else {
            state.expression += key;
        }
    }
    evaluateExpression(false);
    updateUI();
}

function evaluateExpression(saveToHistory = false) {
    if (!state.expression) {
        state.result = 0;
        updateUI();
        return;
    }

    try {
        // Replace visual operators for mathjs
        let sanitized = state.expression.replace(/×/g, '*').replace(/÷/g, '/');
        const res = math.evaluate(sanitized);
        if (typeof res === 'number') {
            state.result = res;
            if (saveToHistory) {
                addToHistory(state.expression, state.result);
                state.expression = res.toString();
            }
        }
    } catch (err) {
        if (saveToHistory) {
            elements.expressionDisplay.innerHTML = '<span style="color: #ff3b30;">格式錯誤</span>';
        }
    }
    calculateCurrency();
}

function calculateCurrency() {
    const converted = state.result * state.exchangeRate;
    elements.toValDisplay.innerText = formatNumber(converted, state.precision);
    elements.fromValDisplay.innerText = formatNumber(state.result, state.precision);
}

function formatNumber(num, precision) {
    if (isNaN(num)) return '0';
    return Number(num.toFixed(precision)).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: precision });
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
    const item = {
        id: Date.now(),
        exp,
        res,
        from: state.fromCurrency,
        to: state.toCurrency,
        rate: state.exchangeRate,
        converted: res * state.exchangeRate
    };
    state.history.unshift(item);
    if (state.history.length > 20) state.history.pop();
    saveSettings();
    renderHistory();
}

function renderHistory() {
    elements.historyList.innerHTML = state.history.map(item => `
        <div class="history-card" onclick="loadHistoryItem(${item.id})">
            <div class="history-exp">${item.exp} = ${item.res} ${item.from}</div>
            <div class="history-res">
                <span>${formatNumber(item.converted, state.precision)} ${item.to}</span>
                <span style="font-size: 0.7rem; color: var(--text-secondary);">1:${item.rate.toFixed(2)}</span>
            </div>
        </div>
    `).join('') || '<div style="text-align:center; padding: 40px; color: var(--text-secondary);">無紀錄</div>';
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

// Event Listeners
document.querySelectorAll('.key').forEach(btn => {
    btn.addEventListener('click', () => handleInput(btn.dataset.key));
});

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
elements.menuOverlay.addEventListener('click', closeMenu);

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
    elements.historyOverlay.classList.add('active');
});

const closeHistory = () => elements.historyOverlay.classList.remove('active');
elements.closeHistoryBtn.addEventListener('click', closeHistory);

elements.clearHistoryBtn.addEventListener('click', () => {
    state.history = [];
    saveSettings();
    renderHistory();
});

elements.shareBtn.addEventListener('click', () => {
    const text = `[CurrX 換算紀錄]
輸入：${state.expression} = ${state.result} ${state.fromCurrency}
結果：${elements.toValDisplay.innerText} ${state.toCurrency}
匯率來源：${state.apiSource} (1 ${state.fromCurrency} = ${state.exchangeRate.toFixed(4)} ${state.toCurrency})`;
    
    if (navigator.share) {
        navigator.share({ title: 'CurrX 換算紀錄', text }).catch(console.error);
    } else {
        navigator.clipboard.writeText(text).then(() => alert('已複製到剪貼簿'));
    }
});

// Haptic feedback
document.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
        if (window.navigator.vibrate) window.navigator.vibrate(10);
    });
});

init();