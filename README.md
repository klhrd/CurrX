# 💱 CurrX - Smart Exchange Rate Calculator (v2.2.0)

> **A minimal, beautiful, and powerful PWA currency converter.**
> Optimized for mobile devices, combining the flexibility of a standard calculator with real-time global exchange rates.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PWA Ready](https://img.shields.io/badge/PWA-Supported-brightgreen.svg)](manifest.json)
[![JS Standard](https://img.shields.io/badge/JavaScript-ES6%2B-yellow.svg)](assets/js/app.js)

---

## 🌟 Key Features

### 1. 🧮 Smart Calculation Engine
- Powered by the `math.js` library — supports arithmetic, percentages, parentheses, and chained operations.
- Real-time evaluation as you type, with results instantly converted to the target currency.

### 2. 🌐 Multi-Source Rate API Fallback
Three open exchange-rate APIs are built in — switch anytime if one source goes down:
- **Fawazahmed0 API** (default: frequently updated, wide currency coverage)
- **ExchangeRate API**
- **Frankfurter API**

### 3. 📖 Global Currency Dictionary with Instant Search
- Over 100 fiat and crypto currencies built in (`currencies.js`).
- Instant filtering by **code (USD)**, **Chinese (美金)**, or **English (US Dollar)**.

### 4. 🌍 Bilingual UI (i18n)
- Interface language switchable between **English** and **Chinese (繁體中文)** from the settings menu.
- Preference is persisted in `localStorage` and auto-detected from the browser language on first visit.

### 5. 📱 Offline & PWA (Progressive Web App) Support
- Offline caching: keep calculating with the last cached rates even without a network.
- "Add to Home Screen" installs it like a native app, with fullscreen and seamless navigation.

### 6. 📜 History & Sharing
- Automatically records the last 20 calculations along with the rates used at the time.
- Tap any history card to instantly restore the expression and currency pair.
- One-tap copy and native Web Share API support for sharing results.

---

## 🛠️ Tech Stack

- **Core**: Vanilla HTML5, CSS3 (Flexbox/Grid, modern CSS variables), JavaScript (ES6+)
- **Libraries**:
  - [Math.js](https://mathjs.org/) - expression parsing and precise calculation
  - [Lucide Icons](https://lucide.dev/) - minimal icon set
  - [Google Fonts](https://fonts.google.com/) - Poppins & Noto Sans TC
- **PWA**: Service Worker (cache-first strategy with core/external asset separation) & Web App Manifest
- **Security**: Content-Security-Policy, Subresource Integrity (SRI) on third-party scripts, HTML escaping, strict `connect-src` API allowlist

---

## 📂 Project Structure

```text
CurrX/
├── index.html              # App shell and overlay modules
├── manifest.json           # PWA manifest (app name, icons, display mode)
├── sw.js                   # Service Worker (offline cache & versioning)
├── LICENSE                 # MIT License
├── README.md               # This file
└── assets/
    ├── css/
    │   └── style.css       # Global styles, theme variables, UI transitions
    ├── js/
    │   ├── app.js          # Main logic (state, i18n, calc, events, render)
    │   └── currencies.js   # Currency dictionary (code, Chinese & English names)
    └── icons/
        ├── icon-192.png    # PWA icon (192x192)
        ├── icon-512.png    # PWA icon (512x512)
        └── icon-1024.png   # PWA icon (1024x1024)
```

---

## 🚀 Getting Started

No build step required — it is a fully static site.

1. Clone the repository.
2. Serve the folder over HTTPS (required for Service Worker / PWA), e.g.:
   ```bash
   npx serve .
   ```
3. Open the served URL in a browser, or deploy to GitHub Pages / any static host.

---

## 📄 License

Released under the [MIT License](LICENSE).
