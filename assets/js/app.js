// 安全讀取 localStorage JSON(避免損毀資料導致啟動失敗)
function safeParse(key) {
    try {
        return JSON.parse(localStorage.getItem(key));
    } catch (e) {
        return null;
    }
}

// i18n 字典(介面語言)
const I18N = {
    en: {
        menuTitle: 'Menu',
        settings: 'Settings',
        history: 'History Lookup',
        multiToggle: 'Multi-Currency View',
        multiError: 'Rates unavailable',
        language: 'Language',
        precision: 'Decimal Places',
        p0: '0 places', p1: '1 place', p2: '2 places', p3: '3 places', p4: '4 places',
        numFormat: 'Number Format',
        fmtStandard: 'Standard (1,234,567)',
        fmtAbbrev: 'Abbreviated (1.2M)',
        fmtScientific: 'Scientific (1.2E+6)',
        displayMode: 'Currency Names',
        dmEn: 'Code only',
        dmZh: 'Chinese only',
        dmBoth: 'Code + Chinese',
        theme: 'Color Theme',
        thSystem: 'System',
        thLight: 'Light',
        thDark: 'Dark',
        apiSource: 'Rate Source',
        fullscreen: 'Auto Fullscreen',
        share: 'Copy & Share',
        pickerTitle: 'Select Currency',
        searchPlaceholder: 'Search code, Chinese or English...',
        historyTitle: 'History',
        clearHistory: 'Clear All Records',
        noResults: 'No results',
        noHistory: 'No records',
        formatError: 'Invalid format',
        loadingCache: 'Loading cache...',
        updating: 'Updating rates...',
        updateFailed: 'Update failed<br>Check network/source',
        lastUpdate: 'Last updated',
        justNow: 'just now',
        minutesAgo: '{n} min ago',
        copied: 'Copied'
    },
    zh: {
        menuTitle: '選單',
        settings: '設定',
        history: '歷史紀錄回溯',
        multiToggle: '多幣別一覽',
        multiError: '匯率無法取得',
        language: '介面語言',
        precision: '小數點位數',
        p0: '0 位', p1: '1 位', p2: '2 位', p3: '3 位', p4: '4 位',
        numFormat: '數值格式',
        fmtStandard: '標準 (1,234,567)',
        fmtAbbrev: '簡寫 (1.2M)',
        fmtScientific: '科學記號 (1.2E+6)',
        displayMode: '顯示語言',
        dmEn: '僅英文',
        dmZh: '僅中文',
        dmBoth: '兩者併列',
        theme: '色彩主題',
        thSystem: '跟隨系統',
        thLight: '淺色模式',
        thDark: '深色模式',
        apiSource: '匯率來源',
        fullscreen: '自動全螢幕',
        share: '複製與分享',
        pickerTitle: '選擇幣別',
        searchPlaceholder: '搜尋代碼、中文或英文...',
        historyTitle: '歷史紀錄',
        clearHistory: '清除所有紀錄',
        noResults: '找不到結果',
        noHistory: '無紀錄',
        formatError: '格式錯誤',
        loadingCache: '正在讀取快取...',
        updating: '正在更新匯率...',
        updateFailed: '更新失敗<br>請檢查網路/來源',
        lastUpdate: '最後更新時間',
        justNow: '剛剛',
        minutesAgo: '{n} 分鐘前',
        copied: '已複製'
    }
};

function t(key) {
    return (I18N[state.lang] || I18N.en)[key] || I18N.en[key] || key;
}

// 套用介面語言至所有標記元素
function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const val = t(el.getAttribute('data-i18n'));
        if (val) el.textContent = val;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const val = t(el.getAttribute('data-i18n-placeholder'));
        if (val) el.placeholder = val;
    });
    if (!state.lastUpdated) elements.refreshStatus.innerHTML = t('loadingCache') + '<br>---';
}

// State Management
const state = {
    expression: '',
    result: 0,
    fromCurrency: localStorage.getItem('fromCurrency') || 'USD',
    toCurrency: localStorage.getItem('toCurrency') || 'TWD',
    exchangeRate: 32.5,
    apiSource: localStorage.getItem('apiSource') || 'fawazahmed',
    precision: parseInt(localStorage.getItem('precision')) || 2,
    displayMode: localStorage.getItem('displayMode') || 'en',
    themeMode: localStorage.getItem('themeMode') || 'system',
    lang: localStorage.getItem('lang') || ((navigator.language || 'en').toLowerCase().startsWith('zh') ? 'zh' : 'en'),
    numFormat: localStorage.getItem('numFormat') || 'standard', // standard, abbrev, scientific
    isFullscreen: localStorage.getItem('isFullscreen') === 'true',
    showMulti: localStorage.getItem('showMulti') === 'true',
    history: safeParse('history') || [],
    lastUpdated: localStorage.getItem('lastUpdated') || null,
    pickingFor: null,
    searchQuery: '',
    multiRates: null,
    multiTargets: (() => {
        const m = safeParse('multiTargets');
        return (Array.isArray(m) && m.length && m.every(c => typeof c === 'string')) ? m : [localStorage.getItem('toCurrency') || 'TWD'];
    })()
};

// 安全取得幣別字典列表
const CURRENCY_LIST_CODES = typeof CURRENCY_DICT !== 'undefined' ? Object.keys(CURRENCY_DICT) : [];
if (!Array.isArray(state.history)) state.history = [];
if (state.multiTargets[0] !== state.toCurrency) {
    state.multiTargets = [state.toCurrency, ...state.multiTargets.filter(c => c !== state.toCurrency)];
}

// 設定主要目標幣別並同步多幣別列表順序
function setPrimaryTarget(code) {
    state.toCurrency = code;
    state.multiTargets = [code, ...state.multiTargets.filter(c => c !== code)];
}

// HTML 跳脫,防止 XSS
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '\u0026amp;', '<': '\u0026lt;', '>': '\u0026gt;', '"': '\u0026quot;', "'": '\u0026#39;' }[c]));

// 安全取得幣別顯示名稱
function getCurrencyName(code, mode) {
    if (typeof CURRENCY_DICT === 'undefined' || !CURRENCY_DICT[code]) return code;
    const data = CURRENCY_DICT[code];
    if (mode === 'zh') return data.zh || code;
    if (mode === 'both') return `${code} ${data.zh || ''}`;
    return code; // default 'en'
}

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
    openSettingsBtn: document.getElementById('openSettingsBtn'),
    settingsOverlay: document.getElementById('settingsOverlay'),
    settingsMenu: document.getElementById('settingsMenu'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),
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
    langSelect: document.getElementById('langSelect'),
    fullscreenCheckbox: document.getElementById('fullscreenCheckbox'),
    multiCurrencyCheckbox: document.getElementById('multiCurrencyCheckbox'),
    multiRows: document.getElementById('multiRows'),
    chipRow: document.getElementById('chipRow'),
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
    if (window.lucide) lucide.createIcons();
    parseHash(); 
    applyI18n();
    applyTheme();
    loadSettings();
    updateUI();
    fetchRates(false);
    renderHistory();
    renderCurrencyList();
    
    // 只有在「不是 PWA standalone 模式」且「使用者開啟全螢幕設定」時才綁定
    if (state.isFullscreen && !isRunningInPWA()) {
        // 使用 capture 階段或是直接在用戶第一次互動時順便執行，不阻斷 click
        const handleFirstInteraction = () => {
            attemptFullscreen();
            document.removeEventListener('pointerdown', handleFirstInteraction);
        };
        // 改用 pointerdown 可以比 click 更早一步調用，不會吃掉 click 事件
        document.addEventListener('pointerdown', handleFirstInteraction, { once: true });
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
        if (typeof CURRENCY_DICT !== 'undefined') {
            if (CURRENCY_DICT[parts[0]]) state.fromCurrency = parts[0];
            if (CURRENCY_DICT[parts[1]]) setPrimaryTarget(parts[1]);
        }
    }
}

function updateHash() {
    const newHash = `#${state.fromCurrency}-${state.toCurrency}`;
    if (window.location.hash !== newHash) {
        history.replaceState(null, null, newHash);
    }
}

function loadSettings() {
    // 修正：僅對真正的 <select> 綁定 .value
    elements.precisionSelect.value = state.precision;
    elements.numFormatSelect.value = state.numFormat;
    elements.apiSourceSelect.value = state.apiSource;
    elements.displayModeSelect.value = state.displayMode;
    elements.themeModeSelect.value = state.themeMode;
    elements.langSelect.value = state.lang;
    elements.fullscreenCheckbox.checked = state.isFullscreen;
    elements.multiCurrencyCheckbox.checked = state.showMulti;
}

function saveSettings() {
    localStorage.setItem('fromCurrency', state.fromCurrency);
    localStorage.setItem('toCurrency', state.toCurrency);
    localStorage.setItem('apiSource', state.apiSource);
    localStorage.setItem('precision', state.precision);
    localStorage.setItem('numFormat', state.numFormat);
    localStorage.setItem('displayMode', state.displayMode);
    localStorage.setItem('themeMode', state.themeMode);
    localStorage.setItem('lang', state.lang);
    localStorage.setItem('isFullscreen', state.isFullscreen);
    localStorage.setItem('showMulti', state.showMulti);
    localStorage.setItem('multiTargets', JSON.stringify(state.multiTargets));
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
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute('content', themeColor);
}

// 檢查是否已經處於 PWA 獨立視窗模式 (Standalone)
function isRunningInPWA() {
    return window.matchMedia('(display-mode: standalone)').matches || 
           window.navigator.standalone === true;
}

// 嘗試全螢幕 (新增保護，避免阻斷點擊)
function attemptFullscreen(e) {
    // 如果已經在全螢幕或已經是 PWA，則直接跳過
    if (document.fullscreenElement || isRunningInPWA()) return;

    if (state.isFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {
            // 靜默忽略不支援全螢幕的裝置 (如 iOS)
        });
    }
}

// 清理過期/過多的匯率快取,避免 localStorage 無限累積
function pruneRateCache() {
    const now = Date.now();
    const entries = [];
    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('rates_')) {
            const v = safeParse(k);
            const ts = (v && typeof v.timestamp === 'number') ? v.timestamp : 0;
            entries.push({ k, ts });
        }
    }
    entries.sort((a, b) => b.ts - a.ts);
    entries.forEach((e, i) => {
        if (i >= 30 || now - e.ts > 604800000) localStorage.removeItem(e.k);
    });
}

// Fetch Rates
async function fetchRates(force = true) {
    if (state.fromCurrency === state.toCurrency) {
        state.exchangeRate = 1;
        state.lastUpdated = Date.now();
        updateStatus();
        calculateCurrency();
        fetchMultiRates();
        return;
    }

    const now = Date.now();
    const cacheKey = `rates_${state.fromCurrency}_${state.toCurrency}_${state.apiSource}`;
    const cachedData = safeParse(cacheKey);

    if (!force && cachedData && typeof cachedData.rate === 'number' && !isNaN(cachedData.rate) && (now - cachedData.timestamp < 3600000)) {
        state.exchangeRate = cachedData.rate;
        state.lastUpdated = cachedData.timestamp;
        updateStatus();
        calculateCurrency();
        fetchMultiRates();
        return;
    }

    elements.refreshBtn.classList.add('animate-spin');
    elements.refreshStatus.innerHTML = t('updating');

    try {
        const config = API_CONFIGS[state.apiSource];
        const url = config.url(state.fromCurrency, state.toCurrency);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const rate = config.getPath(data, state.toCurrency, state.fromCurrency);

        if (rate !== undefined && !isNaN(rate)) {
            state.exchangeRate = rate;
            state.lastUpdated = Date.now();
            localStorage.setItem(cacheKey, JSON.stringify({ rate, timestamp: state.lastUpdated }));
            pruneRateCache();
            updateStatus();
        } else {
            throw new Error('路徑解析失敗');
        }
    } catch (err) {
        console.error('[Fetch Error]', err);
        elements.refreshStatus.innerHTML = t('updateFailed');
    } finally {
        elements.refreshBtn.classList.remove('animate-spin');
        calculateCurrency();
        fetchMultiRates();
    }
}

function updateStatus() {
    if (!state.lastUpdated) return;
    const diff = Math.floor((Date.now() - state.lastUpdated) / 60000);
    const timeStr = diff < 1 ? t('justNow') : t('minutesAgo').replace('{n}', diff);
    elements.refreshStatus.innerHTML = `${t('lastUpdate')}<br>${timeStr}`;
}

// 多幣別一覽(堆疊於目標貨幣下方)
// 統一匯率表鍵值為大寫並過濾非數值(fawazahmed 回傳小寫鍵)
function normRates(raw) {
    const out = {};
    if (raw && typeof raw === 'object') {
        Object.keys(raw).forEach((k) => {
            const v = Number(raw[k]);
            if (!isNaN(v)) out[k.toUpperCase()] = v;
        });
    }
    return out;
}

async function fetchMultiRates() {
    if (!state.showMulti) return;
    const from = state.fromCurrency;
    const cacheKey = `ratesall_${from}_${state.apiSource}`;
    const cached = safeParse(cacheKey);

    if (cached && cached.rates && typeof cached.rates === 'object' && Date.now() - cached.timestamp < 3600000) {
        const norm = normRates(cached.rates);
        if (Object.keys(norm).length) {
            state.multiRates = norm;
            renderMultiRates();
            return;
        }
    }

    try {
        let url, extract;
        if (state.apiSource === 'fawazahmed') {
            url = API_CONFIGS.fawazahmed.url(from);
            extract = (d) => d && d[from.toLowerCase()];
        } else if (state.apiSource === 'exchangerate') {
            url = API_CONFIGS.exchangerate.url(from);
            extract = (d) => d && d.rates;
        } else {
            url = `https://api.frankfurter.app/latest?from=${from}`;
            extract = (d) => d && d.rates;
        }
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const rates = normRates(extract(await response.json()));
        if (!Object.keys(rates).length) throw new Error('parse failed');
        state.multiRates = rates;
        localStorage.setItem(cacheKey, JSON.stringify({ rates, timestamp: Date.now() }));
        renderMultiRates();
    } catch (err) {
        console.warn('[CurrX] multi rates fetch failed:', err.message);
        if (cached && cached.rates) {
            const norm = normRates(cached.rates);
            if (Object.keys(norm).length) {
                state.multiRates = norm;
                renderMultiRates();
            }
        }
    }
}

function renderMultiRates() {
    if (!state.showMulti || !state.multiRates) {
        if (state.showMulti) {
            elements.multiRows.innerHTML = '<div class="res-unit" style="opacity:0.5;">...</div>';
            console.debug('[CurrX] multi rows pending: toggle on but rates not loaded');
        } else {
            elements.multiRows.innerHTML = '';
        }
        return;
    }
    const rates = state.multiRates;
    elements.multiRows.innerHTML = state.multiTargets
        .filter(c => c !== state.fromCurrency && c !== state.toCurrency && typeof rates[c] === 'number')
        .map(c => `
            <div class="res-row multi-res">
                <span class="res-val">${esc(formatNumber(state.result * rates[c]))}</span>
                <span class="res-unit">${esc(c)}</span>
            </div>
        `).join('');
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
        if (typeof res === 'number' && !isNaN(res)) {
            state.result = res;
            if (save) {
                addToHistory(state.expression, state.result);
                state.expression = Number(res.toFixed(8)).toString();
            }
        }
    } catch (e) {
        // 輸入過程中算式不完整時靜默忽略；只有按下 `=` (save=true) 時才提示格式錯誤
        if (save) {
            const originalExp = state.expression;
            elements.expressionDisplay.innerHTML = '<span style="color:#ff7675">' + t('formatError') + '</span>';
            setTimeout(() => { if(state.expression === originalExp) updateUI(); }, 1200);
        }
    }
    calculateCurrency();
}

function calculateCurrency() {
    elements.fromValDisplay.innerText = formatNumber(state.result);
    elements.toValDisplay.innerText = formatNumber(state.result * state.exchangeRate);
    renderMultiRates();
    
    requestAnimationFrame(() => {
        const results = document.querySelector('.results');
        if (results) results.scrollLeft = results.scrollWidth;
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
        const scaled = num / Math.pow(1000, Math.min(unitIndex, units.length - 1));
        return scaled.toFixed(state.precision) + (units[unitIndex] || '');
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
    if (expCont) expCont.scrollLeft = expCont.scrollWidth;
    
    updateHash();
}

// Currency Picker
function renderCurrencyList() {
    if (typeof CURRENCY_DICT === 'undefined') return;
    const query = state.searchQuery.toLowerCase();
    const filteredCodes = CURRENCY_LIST_CODES.filter(code => {
        const data = CURRENCY_DICT[code];
        return code.toLowerCase().includes(query) || 
               (data.zh && data.zh.toLowerCase().includes(query)) || 
               (data.en && data.en.toLowerCase().includes(query));
    });

    elements.currencyList.innerHTML = filteredCodes.map(code => {
        const data = CURRENCY_DICT[code];
        const isSel = state.pickingFor === 'to' && state.multiTargets.includes(code);
        return `
            <div class="currency-list-item${isSel ? ' selected' : ''}" data-code="${esc(code)}">
                <div style="display:flex; flex-direction:column">
                    <span style="font-weight:700">${esc(code)}</span>
                    <span style="font-size:0.75rem; opacity:0.6">${esc(data.zh || '')}</span>
                </div>
                <span style="font-size:0.75rem; opacity:0.6; align-self:center">${esc(data.en || '')}</span>
            </div>
        `;
    }).join('') || '<div style="text-align:center; padding:40px; opacity:0.5">' + t('noResults') + '</div>';
}

function openPicker(type) {
    state.pickingFor = type;
    state.searchQuery = '';
    elements.currencySearch.value = '';
    renderChips();
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
    if (state.pickingFor === 'from') {
        state.fromCurrency = code;
        saveSettings();
        updateUI();
        fetchRates(true);
        closePicker();
        return;
    }
    // 目標幣別多選:切換加入/移除,維持選擇器開啟
    const idx = state.multiTargets.indexOf(code);
    if (idx >= 0) {
        if (state.multiTargets.length <= 1) return; // 至少保留一個目標
        state.multiTargets.splice(idx, 1);
    } else {
        state.multiTargets.push(code);
    }
    state.toCurrency = state.multiTargets[0];
    saveSettings();
    updateUI();
    fetchRates(true);
    renderChips();
    renderCurrencyList();
};

// 目標幣別晶片(並列顯示、拖曳排序)
function renderChips() {
    if (state.pickingFor !== 'to') {
        elements.chipRow.style.display = 'none';
        return;
    }
    elements.chipRow.style.display = 'flex';
    elements.chipRow.innerHTML = state.multiTargets.map((c, i) =>
        `<div class="chip${i === 0 ? ' primary' : ''}" data-code="${esc(c)}">${esc(c)}</div>`
    ).join('');
}

(function setupChipDrag() {
    let dragChip = null;
    elements.chipRow.addEventListener('pointerdown', (e) => {
        const chip = e.target.closest('.chip');
        if (!chip) return;
        dragChip = chip;
        let moved = false;

        const onMove = (ev) => {
            if (!dragChip) return;
            moved = true;
            dragChip.classList.add('dragging');
            const target = document.elementFromPoint(ev.clientX, ev.clientY);
            const overChip = target && target.closest('.chip');
            if (overChip && overChip !== dragChip) {
                const rect = overChip.getBoundingClientRect();
                const before = (ev.clientX < rect.left + rect.width / 2) || (ev.clientY < rect.top + rect.height / 2);
                elements.chipRow.insertBefore(dragChip, before ? overChip : overChip.nextSibling);
            }
            ev.preventDefault();
        };
        const onUp = () => {
            if (dragChip) {
                dragChip.classList.remove('dragging');
                if (moved) {
                    state.multiTargets = Array.from(elements.chipRow.querySelectorAll('.chip')).map(c => c.dataset.code);
                    state.toCurrency = state.multiTargets[0];
                    saveSettings();
                    updateUI();
                    fetchRates(true);
                    renderChips();
                    renderCurrencyList();
                }
            }
            dragChip = null;
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
    });
})();

// History
function addToHistory(exp, res) {
    state.history.unshift({ id: Date.now(), exp, res, from: state.fromCurrency, to: state.toCurrency, rate: state.exchangeRate, api: state.apiSource });
    if (state.history.length > 20) state.history.pop();
    saveSettings();
    renderHistory();
}

function renderHistory() {
    elements.historyList.innerHTML = state.history.map(item => {
        const rate = Number(item.rate) || 0;
        return `
        <div class="history-card" data-id="${esc(item.id)}">
            <div style="font-size:0.75rem; color:var(--text-secondary)">${esc(item.exp)} = ${esc(item.res)} ${esc(item.from)}</div>
            <div style="font-weight:600; display:flex; justify-content:space-between">
                <span>${esc(formatNumber(Number(item.res) * rate))} ${esc(item.to)}</span>
                <span style="font-size:0.65rem; opacity:0.6">1:${rate.toFixed(4)} (${esc(item.api)})</span>
            </div>
        </div>
    `;
    }).join('') || '<div style="text-align:center; padding:40px; opacity:0.5">' + t('noHistory') + '</div>';
}

window.loadHistoryItem = (id) => {
    const item = state.history.find(i => i.id === id);
    if (item) {
        state.expression = item.res.toString();
        state.result = item.res;
        state.fromCurrency = item.from;
        setPrimaryTarget(item.to);
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

// 設定面板(由選單進入)
elements.openSettingsBtn.addEventListener('click', () => {
    closeMenu();
    elements.settingsOverlay.style.display = 'block';
    setTimeout(() => elements.settingsMenu.classList.add('active'), 10);
});
const closeSettings = () => { elements.settingsMenu.classList.remove('active'); setTimeout(() => elements.settingsOverlay.style.display = 'none', 300); };
elements.closeSettingsBtn.addEventListener('click', closeSettings);
elements.settingsOverlay.addEventListener('click', (e) => { if (e.target === elements.settingsOverlay) closeSettings(); });
elements.fromCurrencyBtn.addEventListener('click', () => openPicker('from'));
elements.toCurrencyBtn.addEventListener('click', () => openPicker('to'));
elements.closePickerBtn.addEventListener('click', closePicker);
elements.currencySearch.addEventListener('input', (e) => { state.searchQuery = e.target.value; renderCurrencyList(); });

// 事件委託:取代 inline onclick,避免 HTML 屬性注入
elements.currencyList.addEventListener('click', (e) => {
    const item = e.target.closest('.currency-list-item');
    if (item && item.dataset.code) selectCurrency(item.dataset.code);
});
elements.historyList.addEventListener('click', (e) => {
    const card = e.target.closest('.history-card');
    if (card) loadHistoryItem(Number(card.dataset.id));
});

// 修正：Swap 正確觸發 Hash 更新並拉取完整匯率
elements.swapBtn.addEventListener('click', () => { 
    const primary = state.multiTargets[0] || state.toCurrency;
    state.multiTargets = [state.fromCurrency, ...state.multiTargets.slice(1).filter(c => c !== state.fromCurrency)];
    state.fromCurrency = primary;
    state.toCurrency = state.multiTargets[0];
    saveSettings();
    updateUI(); 
    fetchRates(true); 
});

elements.precisionSelect.addEventListener('change', (e) => { state.precision = parseInt(e.target.value); saveSettings(); calculateCurrency(); });
elements.numFormatSelect.addEventListener('change', (e) => { state.numFormat = e.target.value; saveSettings(); calculateCurrency(); });
elements.apiSourceSelect.addEventListener('change', (e) => { state.apiSource = e.target.value; saveSettings(); fetchRates(true); });
elements.displayModeSelect.addEventListener('change', (e) => { state.displayMode = e.target.value; saveSettings(); updateUI(); renderMultiRates(); });
elements.themeModeSelect.addEventListener('change', (e) => { state.themeMode = e.target.value; saveSettings(); applyTheme(); });
elements.fullscreenCheckbox.addEventListener('change', (e) => { state.isFullscreen = e.target.checked; saveSettings(); if (state.isFullscreen) attemptFullscreen(); });
elements.multiCurrencyCheckbox.addEventListener('change', (e) => {
    state.showMulti = e.target.checked;
    saveSettings();
    renderMultiRates();
    if (state.showMulti && !state.multiRates) fetchMultiRates();
});
elements.historyBtn.addEventListener('click', () => { closeMenu(); elements.historyOverlay.style.display = 'flex'; setTimeout(() => elements.historyContent.classList.add('active'), 10); });
const closeHistory = () => { elements.historyContent.classList.remove('active'); setTimeout(() => elements.historyOverlay.style.display = 'none', 300); };
elements.closeHistoryBtn.addEventListener('click', closeHistory);
elements.clearHistoryBtn.addEventListener('click', () => { state.history = []; saveSettings(); renderHistory(); });
elements.shareBtn.addEventListener('click', () => {
    const text = `[CurrX] ${state.expression} = ${state.result} ${state.fromCurrency} -> ${formatNumber(state.result * state.exchangeRate)} ${state.toCurrency}`;
    if (navigator.share) navigator.share({ text }).catch(() => {});
    else navigator.clipboard.writeText(text).then(() => alert(t('copied')));
});

// 介面語言切換
elements.langSelect.addEventListener('change', (e) => {
    state.lang = e.target.value;
    saveSettings();
    applyI18n();
});

// 啟動應用程式
init();