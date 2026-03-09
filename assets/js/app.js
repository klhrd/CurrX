// State Management
const state = {
    expression: '',
    result: 0,
    fromCurrency: 'USD',
    toCurrency: 'TWD',
    exchangeRate: 32.5,
    apiSource: localStorage.getItem('apiSource') || 'fawazahmed',
    precision: parseInt(localStorage.getItem('precision')) || 2,
    displayMode: localStorage.getItem('displayMode') || 'en',
    themeMode: localStorage.getItem('themeMode') || 'system',
    numFormat: localStorage.getItem('numFormat') || 'standard', // standard, abbrev, scientific
    isFullscreen: localStorage.getItem('isFullscreen') !== 'false',
    history: JSON.parse(localStorage.getItem('history')) || [],
    lastUpdated: localStorage.getItem('lastUpdated') || null,
    pickingFor: null,
    searchQuery: ''
};

const CURRENCY_LIST_CODES = Object.keys(CURRENCY_DICT);

// API Configurations
const API_CONFIGS = {
    fawazahmed: {
        url: (from) => `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${from.toLowerCase()}.json`,
        getPath: (data, to, from) => data?.[from.toLowerCase()]?.[to.toLowerCase()]
    },
    exchangerate: {
        url: (from) => `https://open.er-api.com/v6/latest/${from}`,
        getPath: (data, to) => data?.rates?.[to]
    },
    frankfurter: {
        url: (from, to) => `https://api.frankfurter.app/latest?from=${from}&to=${to}`,
        getPath: (data, to) => data?.rates?.[to]
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
    fromCurrencyBtn: document.getElementById('fromCurrencyBtn'),
    toCurrencyBtn: document.getElementById('toCurrencyBtn'),
    swapBtn: document.getElementById('swapBtn'),
    fromCurrency: document.getElementById('fromCurrency'),
    toCurrency: document.getElementById('toCurrency'),
    expressionDisplay: document.getElementById('expressionDisplay'),
    fromValDisplay: document.getElementById('fromValDisplay'),
    toValDisplay: document.getElementById('toValDisplay'),
    fromUnit: document.getElementById('fromUnit'),
    toUnit: document.getElementById('toUnit'),
    precisionSelect: document.getElementById('precisionSelect'),
    numFormatSelect: document.getElementById('numFormatSelect'),
    apiSourceSelect: document.getElementById('apiSourceSelect'),
    displayModeSelect: document.getElementById('displayModeSelect'),
    themeModeSelect: document.getElementById('themeModeSelect'),
    fullscreenCheckbox: document.getElementById('fullscreenCheckbox'),
    historyBtn: document.getElementById('historyBtn'),
    historyOverlay: document.getElementById('historyOverlay'),
    historyContent: document.getElementById('historyContent'),
    closeHistoryBtn: document.getElementById('closeHistoryBtn'),
    historyList: document.getElementById('historyList'),
    clearHistoryBtn: document.getElementById('clearHistoryBtn'),
    shareBtn: document.getElementById('shareBtn'),
    pickerOverlay: document.getElementById('pickerOverlay'),
    pickerContent: document.getElementById('pickerContent'),
    closePickerBtn: document.getElementById('closePickerBtn'),
    currencyList: document.getElementById('currencyList'),
    currencySearch: document.getElementById('currencySearch')
};

// Initialize
function init() {
    lucide.createIcons();
    parseHash(); // Parse URL hash first
    applyTheme();
    loadSettings();
    updateUI();
    fetchRates(false);
    renderHistory();
    renderCurrencyList();
    
    if (state.isFullscreen) {
        document.addEventListener('click', attemptFullscreen, { once: true });
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (state.themeMode === 'system') applyTheme();
    });

    window.addEventListener('hashchange', () => {
        parseHash();
        updateUI();
        fetchRates(true);
    });
}

function parseHash() {
    const hash = window.location.hash.substring(1).toUpperCase();
    if (!hash) return;
    
    const parts = hash.split(/[-/]/);
    if (parts.length === 2) {
        if (CURRENCY_DICT[parts[0]]) state.fromCurrency = parts[0];
        if (CURRENCY_DICT[parts[1]]) state.toCurrency = parts[1];
    }
}

function updateHash() {
    const newHash = `#${state.fromCurrency}-${state.toCurrency}`;
    if (window.location.hash !== newHash) {
        history.replaceState(null, null, newHash);
    }
}

function loadSettings() {
    elements.precisionSelect.value = state.precision;
    elements.numFormatSelect.value = state.numFormat;
    elements.apiSourceSelect.value = state.apiSource;
    elements.displayModeSelect.value = state.displayMode;
    elements.themeModeSelect.value = state.themeMode;
    elements.fullscreenCheckbox.checked = state.isFullscreen;
}

function saveSettings() {
    localStorage.setItem('apiSource', state.apiSource);
    localStorage.setItem('precision', state.precision);
    localStorage.setItem('numFormat', state.numFormat);
    localStorage.setItem('displayMode', state.displayMode);
    localStorage.setItem('themeMode', state.themeMode);
    localStorage.setItem('isFullscreen', state.isFullscreen);
    localStorage.setItem('history', JSON.stringify(state.history));
}

function applyTheme() {
    let isDark = false;
    if (state.themeMode === 'system') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
        isDark = (state.themeMode === 'dark');
    }
    document.body.classList.toggle('dark-mode', isDark);
    const themeColor = isDark ? '#000000' : '#5c6bc0';
    document.querySelector('meta[name="theme-color"]').setAttribute('content', themeColor);
}

function attemptFullscreen() {
    if (state.isFullscreen && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
    }
}

// Fetch Rates
async function fetchRates(force = true) {
    if (state.fromCurrency === state.toCurrency) {
        state.exchangeRate = 1;
        state.lastUpdated = Date.now();
        updateStatus();
        calculateCurrency();
        return;
    }

    const now = Date.now();
    const cacheKey = `rates_${state.fromCurrency}_${state.toCurrency}_${state.apiSource}`;
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
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const rate = config.getPath(data, state.toCurrency, state.fromCurrency);

        if (rate !== undefined) {
            state.exchangeRate = rate;
            state.lastUpdated = Date.now();
            localStorage.setItem(cacheKey, JSON.stringify({ rate, timestamp: state.lastUpdated }));
            updateStatus();
        } else {
            throw new Error('路徑解析失敗');
        }
    } catch (err) {
        console.error('[Fetch Error]', err);
        elements.refreshStatus.innerHTML = '更新失敗<br>請檢查網路/來源';
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
    const visualOps = { '*': '×', '/': '÷', '-': '−' };
    const logicalOps = ['+', '-', '*', '/', '.', '%'];
    
    if (window.navigator.vibrate) {
        const isDark = document.body.classList.contains('dark-mode');
        window.navigator.vibrate(isDark ? 15 : 10);
    }

    if (key === 'AC') {
        state.expression = '';
        state.result = 0;
    } else if (key === 'BACK') {
        state.expression = state.expression.slice(0, -1);
    } else if (key === '=') {
        evaluateExpression(true);
        return;
    } else {
        const lastChar = state.expression.slice(-1);
        const displayKey = visualOps[key] || key;
        const isCurrentOp = logicalOps.includes(key);
        const isLastOp = ['+', '−', '×', '÷', '.', '%'].includes(lastChar);
        if (isCurrentOp && isLastOp) {
            state.expression = state.expression.slice(0, -1) + displayKey;
        } else {
            state.expression += displayKey;
        }
    }
    evaluateExpression(false);
    updateUI();
}

function evaluateExpression(save = false) {
    if (!state.expression) {
        state.result = 0;
        calculateCurrency();
        return;
    }
    try {
        let clean = state.expression.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
        const res = math.evaluate(clean);
        if (typeof res === 'number') {
            state.result = res;
            if (save) {
                addToHistory(state.expression, state.result);
                state.expression = Number(res.toFixed(8)).toString();
            }
        }
    } catch (e) {
        if (save) {
            const originalExp = state.expression;
            elements.expressionDisplay.innerHTML = '<span style="color:#ff7675">格式錯誤</span>';
            setTimeout(() => { if(state.expression === originalExp) updateUI(); }, 1200);
        }
    }
    calculateCurrency();
}

function calculateCurrency() {
    elements.fromValDisplay.innerText = formatNumber(state.result);
    elements.toValDisplay.innerText = formatNumber(state.result * state.exchangeRate);
    
    requestAnimationFrame(() => {
        const results = document.querySelector('.results');
        results.scrollLeft = results.scrollWidth;
    });
}

function formatNumber(num) {
    if (isNaN(num)) return '0';
    
    if (state.numFormat === 'scientific' && Math.abs(num) >= 1000000) {
        return num.toExponential(2).toUpperCase();
    }
    
    if (state.numFormat === 'abbrev' && Math.abs(num) >= 1000) {
        const units = ['', 'K', 'M', 'B', 'T'];
        const unitIndex = Math.floor(Math.log10(Math.abs(num)) / 3);
        const scaled = num / Math.pow(1000, unitIndex);
        return scaled.toFixed(state.precision) + units[unitIndex];
    }

    return Number(num.toFixed(state.precision)).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: state.precision
    });
}

function updateUI() {
    elements.expressionDisplay.innerText = state.expression;
    elements.fromCurrency.innerText = getCurrencyName(state.fromCurrency, state.displayMode);
    elements.toCurrency.innerText = getCurrencyName(state.toCurrency, state.displayMode);
    elements.fromUnit.innerText = state.fromCurrency;
    elements.toUnit.innerText = state.toCurrency;
    
    const expCont = document.getElementById('expressionDisplay');
    expCont.scrollLeft = expCont.scrollWidth;
    
    updateHash();
}

// Currency Picker
function renderCurrencyList() {
    const query = state.searchQuery.toLowerCase();
    const filteredCodes = CURRENCY_LIST_CODES.filter(code => {
        const data = CURRENCY_DICT[code];
        return code.toLowerCase().includes(query) || 
               (data.zh && data.zh.toLowerCase().includes(query)) || 
               (data.en && data.en.toLowerCase().includes(query));
    });

    elements.currencyList.innerHTML = filteredCodes.map(code => {
        const data = CURRENCY_DICT[code];
        return `
            <div class="currency-list-item" onclick="selectCurrency('${code}')">
                <div style="display:flex; flex-direction:column">
                    <span style="font-weight:700">${code}</span>
                    <span style="font-size:0.75rem; opacity:0.6">${data.zh || ''}</span>
                </div>
                <span style="font-size:0.75rem; opacity:0.6; align-self:center">${data.en || ''}</span>
            </div>
        `;
    }).join('') || '<div style="text-align:center; padding:40px; opacity:0.5">找不到結果</div>';
}

function openPicker(type) {
    state.pickingFor = type;
    state.searchQuery = '';
    elements.currencySearch.value = '';
    renderCurrencyList();
    elements.pickerOverlay.style.display = 'block';
    setTimeout(() => elements.pickerContent.classList.add('active'), 10);
    setTimeout(() => elements.currencySearch.focus(), 300);
}

const closePicker = () => {
    elements.pickerContent.classList.remove('active');
    setTimeout(() => elements.pickerOverlay.style.display = 'none', 300);
};

window.selectCurrency = (code) => {
    if (state.pickingFor === 'from') state.fromCurrency = code;
    else state.toCurrency = code;
    updateUI();
    fetchRates(true);
    closePicker();
};

// History
function addToHistory(exp, res) {
    state.history.unshift({ id: Date.now(), exp, res, from: state.fromCurrency, to: state.toCurrency, rate: state.exchangeRate, api: state.apiSource });
    if (state.history.length > 20) state.history.pop();
    saveSettings();
    renderHistory();
}

function renderHistory() {
    elements.historyList.innerHTML = state.history.map(item => `
        <div class="history-card" onclick="loadHistoryItem(${item.id})">
            <div style="font-size:0.75rem; color:var(--text-secondary)">${item.exp} = ${item.res} ${item.from}</div>
            <div style="font-weight:600; display:flex; justify-content:space-between">
                <span>${formatNumber(item.res * item.rate)} ${item.to}</span>
                <span style="font-size:0.65rem; opacity:0.6">1:${item.rate.toFixed(4)} (${item.api})</span>
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
        state.apiSource = item.api || state.apiSource;
        updateUI();
        calculateCurrency();
        closeHistory();
    }
};

// Events
document.querySelectorAll('.key').forEach(btn => btn.addEventListener('click', () => handleInput(btn.dataset.key)));
elements.refreshBtn.addEventListener('click', () => fetchRates(true));
elements.menuBtn.addEventListener('click', () => { elements.menuOverlay.style.display = 'block'; setTimeout(() => elements.sideMenu.classList.add('active'), 10); });
const closeMenu = () => { elements.sideMenu.classList.remove('active'); setTimeout(() => elements.menuOverlay.style.display = 'none', 300); };
elements.closeMenuBtn.addEventListener('click', closeMenu);
elements.menuOverlay.addEventListener('click', (e) => { if (e.target === elements.menuOverlay) closeMenu(); });
elements.fromCurrencyBtn.addEventListener('click', () => openPicker('from'));
elements.toCurrencyBtn.addEventListener('click', () => openPicker('to'));
elements.closePickerBtn.addEventListener('click', closePicker);
elements.currencySearch.addEventListener('input', (e) => { state.searchQuery = e.target.value; renderCurrencyList(); });
elements.swapBtn.addEventListener('click', () => { [state.fromCurrency, state.toCurrency] = [state.toCurrency, state.fromCurrency]; state.exchangeRate = 1 / state.exchangeRate; updateUI(); fetchRates(false); });
elements.precisionSelect.addEventListener('change', (e) => { state.precision = parseInt(e.target.value); saveSettings(); calculateCurrency(); });
elements.numFormatSelect.addEventListener('change', (e) => { state.numFormat = e.target.value; saveSettings(); calculateCurrency(); });
elements.apiSourceSelect.addEventListener('change', (e) => { state.apiSource = e.target.value; saveSettings(); fetchRates(true); });
elements.displayModeSelect.addEventListener('change', (e) => { state.displayMode = e.target.value; saveSettings(); updateUI(); });
elements.themeModeSelect.addEventListener('change', (e) => { state.themeMode = e.target.value; saveSettings(); applyTheme(); });
elements.fullscreenCheckbox.addEventListener('change', (e) => { state.isFullscreen = e.target.checked; saveSettings(); if (state.isFullscreen) attemptFullscreen(); });
elements.historyBtn.addEventListener('click', () => { closeMenu(); elements.historyOverlay.style.display = 'flex'; setTimeout(() => elements.historyContent.classList.add('active'), 10); });
const closeHistory = () => { elements.historyContent.classList.remove('active'); setTimeout(() => elements.historyOverlay.style.display = 'none', 300); };
elements.closeHistoryBtn.addEventListener('click', closeHistory);
elements.clearHistoryBtn.addEventListener('click', () => { state.history = []; saveSettings(); renderHistory(); });
elements.shareBtn.addEventListener('click', () => {
    const text = `[CurrX] ${state.expression} = ${state.result} ${state.fromCurrency} -> ${formatNumber(state.result * state.exchangeRate)} ${state.toCurrency}`;
    if (navigator.share) navigator.share({ text }).catch(() => {});
    else navigator.clipboard.writeText(text).then(() => alert('已複製'));
});

init();