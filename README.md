# CurrX - 智能貨幣計算機 (v0.1.8)

![CurrX Icon](assets/icons/icon-192.png)

CurrX 是一款專為行動裝置優化的極簡、美觀且強大的匯率計算 PWA (Progressive Web App)。它結合了標準計算機與即時匯率轉換功能，讓您在旅行或跨境購物時能快速得出結果。

## ✨ 功能亮點

- **智慧計算引擎**：整合 `math.js`，支援括號運算、百分比計算與連續運算。
- **多路 API 備援**：支援 Fawazahmed0 (優先)、ExchangeRate 與 Frankfurter 三大匯率來源，確保數據準確不中斷。
- **全球幣別字典**：內建超過 100 種常用貨幣與加密貨幣，支援中文、英文及雙語對照顯示。
- **強大搜尋功能**：幣別選擇器支援代碼、中文名稱與英文名稱即時過濾。
- **PWA 支援**：支援離線使用，並可將應用程式「安裝」至手機桌面或電腦導航列。
- **歷史紀錄回溯**：自動儲存計算軌跡，隨時點擊即可重新載入數值。
- **極簡美學**：採用 Apple 風格的去區塊化平坦設計，支援深色模式 (Dark Mode) 與觸覺回饋。

## 🛠️ 技術堆疊

- **Frontend**: HTML5, Vanilla CSS3 (Custom Variables), JavaScript (ES6+)
- **Libraries**: 
  - [math.js](https://mathjs.org/) - 數學運算處理
  - [Lucide Icons](https://lucide.dev/) - 向量圖示
- **APIs**: 
  - Fawazahmed0 Currency API
  - ExchangeRate-API
  - Frankfurter API

## 📦 專案結構

```text
CurrX/
├── assets/              # 靜態資源
│   ├── css/             # 樣式表
│   ├── js/              # 核心邏輯與幣別字典
│   └── icons/           # PWA 圖示
├── docs/                # 開發文件與設計草圖
├── index.html           # 應用程式入口
├── manifest.json        # PWA 配置文件
└── sw.js                # Service Worker (支援離線存取)
```

## 🚀 快速開始

### 在瀏覽器中開啟
直接開啟 `index.html` 即可使用。

### 安裝至裝置 (PWA)
1. 使用 Chrome 或 Safari (iOS) 開啟應用程式網址。
2. 點擊瀏覽器選單中的「安裝應用程式」或「加入主畫面」。
3. 即可像原生 App 一樣從桌面開啟，並享受全螢幕體驗。

## 📄 授權條款

本專案採用 **MIT License** 授權。詳情請參閱 [LICENSE](LICENSE) 檔案。
