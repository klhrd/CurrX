# 💱 CurrX - 智能匯率計算機 (v2.1.0)

> **極簡、美觀且強大的 PWA 匯率計算工具** > 專為行動裝置優化，結合標準計算機靈活度與即時全球匯率轉換。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PWA Ready](https://img.shields.io/badge/PWA-Supported-brightgreen.svg)](manifest.json)
[![JS Standard](https://img.shields.io/badge/JavaScript-ES6%2B-yellow.svg)](assets/js/app.js)

---

## ✨ v2.1.0 重大更新與修復 (Release Notes)

- ⚡ **原生 PWA 觸控體驗優化**：修復「全螢幕模式」在 Android / iOS PWA 模式下首擊無效（First Click Blocked）的事件阻斷問題。
- 🔄 **無縫貨幣對調 (Smart Swap)**：改寫幣別對調邏輯，自動同步更新 URL Hash 並重拉官方 API 精確匯率，避免多次對調後的浮點數累積誤差。
- 🛡️ **計算引擎錯誤隔離**：即時輸入過程不完整算式（如 `5 +`）採靜默容錯處理，僅於按下 `=` 時提示「格式錯誤」，極大地提升連續輸入順暢度。
- 🚀 **Service Worker 快取升級**：更新 `sw.js` 至 `currx-v2`，加入自動清空舊版本快取的 `activate` 監聽機制，解決更新後頁面卡在舊版問題。
- 🌐 **動態 URL Hash 導航**：支援網址直接代入幣別（如 `#USD-TWD`），方便分享或建立捷徑。

---

## 🌟 主要功能亮點

### 1. 🧮 智慧計算引擎
- 整合 `math.js` 數學庫，支援四則運算、百分比計算與連續運算。
- 輸入即時計算，結果直觀同步至目標貨幣。

### 2. 🌐 多路 API 匯率備援機制
內建三大開放匯率 API 來源，當單一來源異常時可隨時切換：
- **Fawazahmed0 API**（預設，更新頻率高、幣別齊全）
- **ExchangeRate API**
- **Frankfurter API**

### 3. 📖 全球幣別字典與極速搜尋
- 內建超過 100 種常用法定貨幣與加密貨幣字典 (`currencies.js`)。
- 支援**代碼 (USD)**、**中文 (美金)** 與 **英文 (US Dollar)** 的多語系關鍵字即時過濾。

### 4. 📱 離線與 PWA (Progressive Web App) 支援
- 支援離線快取，無網路狀態下仍可使用上次快取匯率進行計算。
- 可直接「新增至主畫面」作為原生 App 使用，支援全螢幕與無縫導航列體驗。

### 5. 📜 歷史紀錄與分享
- 自動記錄近 20 筆計算結果與當時採用的匯率。
- 點擊歷史卡片即可一鍵還原算式與幣別組合。
- 一鍵複製與調用系統原生 Web Share API 快速分享計算結果。

---

## 🛠️ 技術堆疊 (Tech Stack)

- **前端核心**：原生 HTML5、CSS3 (Flexbox/Grid, Modern CSS Variables)、JavaScript (ES6+)
- **外掛套件**：
  - [Math.js](https://mathjs.org/) - 數學算式解析與精確計算
  - [Lucide Icons](https://lucide.dev/) - 極簡圖標庫
  - [Google Fonts](https://fonts.google.com/) - Poppins & Noto Sans TC
- **PWA 規範**：Service Worker (Cache First Strategy) & Web App Manifest

---

## 📂 專案檔案結構

```text
CurrX/
├── index.html              # 應用程式主結構與 Overlay 模組
├── manifest.json           # PWA 設定檔 (應用程式名稱、圖示與顯示模式)
├── sw.js                   # Service Worker (離線快取與版本控管)
├── LICENSE                 # MIT 開源授權條款
├── README.md               # 專案說明文件
└── assets/
    ├── css/
    │   └── style.css       # 全局樣式、主題變數與 UI 切換動畫
    ├── js/
    │   ├── app.js          # 應用程式主邏輯 (State, Calc, Events, Render)
    │   └── currencies.js   # 全球幣別字典 (代碼、中文與英文映射)
    └── icons/
        ├── icon-192.png    # PWA 圖示 (192x192)
        ├── icon-512.png    # PWA 圖示 (512x512)
        └── icon-1024.png   # PWA 高畫質圖示