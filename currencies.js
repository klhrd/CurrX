const CURRENCY_DICT = {
    "USD": { "cn": "美金", "en": "US Dollar" },
    "TWD": { "cn": "新台幣", "en": "Taiwan Dollar" },
    "JPY": { "cn": "日圓", "en": "Japanese Yen" },
    "EUR": { "cn": "歐元", "en": "Euro" },
    "HKD": { "cn": "港幣", "en": "Hong Kong Dollar" },
    "KRW": { "cn": "韓元", "en": "South Korean Won" },
    "CNY": { "cn": "人民幣", "en": "Chinese Yuan" },
    "GBP": { "cn": "英鎊", "en": "British Pound" },
    "AUD": { "cn": "澳幣", "en": "Australian Dollar" },
    "CAD": { "cn": "加幣", "en": "Canadian Dollar" },
    "SGD": { "cn": "新加坡幣", "en": "Singapore Dollar" },
    "THB": { "cn": "泰銖", "en": "Thai Baht" },
    "CHF": { "cn": "瑞士法郎", "en": "Swiss Franc" },
    "NZD": { "cn": "紐西蘭幣", "en": "New Zealand Dollar" },
    "MYR": { "cn": "馬來西亞幣", "en": "Malaysian Ringgit" },
    "VND": { "cn": "越南盾", "en": "Vietnamese Dong" },
    "PHP": { "cn": "菲律賓披索", "en": "Philippine Peso" },
    "IDR": { "cn": "印尼盾", "en": "Indonesian Rupiah" },
    "INR": { "cn": "印度盧比", "en": "Indian Rupee" },
    "MOP": { "cn": "澳門幣", "en": "Macau Pataca" }
};

// Function to get display name based on mode
function getCurrencyName(code, mode) {
    const data = CURRENCY_DICT[code] || { "cn": code, "en": code };
    switch (mode) {
        case 'cn': return data.cn;
        case 'en': return code;
        case 'both': return `${code} ${data.cn}`;
        default: return code;
    }
}