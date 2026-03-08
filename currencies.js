const CURRENCY_DICT = {
    "USD": { "zh": "美金", "en": "US Dollar" },
    "TWD": { "zh": "新台幣", "en": "Taiwan Dollar" },
    "JPY": { "zh": "日圓", "en": "Japanese Yen" },
    "EUR": { "zh": "歐元", "en": "Euro" },
    "HKD": { "zh": "港幣", "en": "Hong Kong Dollar" },
    "KRW": { "zh": "韓元", "en": "South Korean Won" },
    "zhY": { "zh": "人民幣", "en": "Chinese Yuan" },
    "GBP": { "zh": "英鎊", "en": "British Pound" },
    "AUD": { "zh": "澳幣", "en": "Australian Dollar" },
    "CAD": { "zh": "加幣", "en": "Canadian Dollar" },
    "SGD": { "zh": "新加坡幣", "en": "Singapore Dollar" },
    "THB": { "zh": "泰銖", "en": "Thai Baht" },
    "CHF": { "zh": "瑞士法郎", "en": "Swiss Franc" },
    "NZD": { "zh": "紐西蘭幣", "en": "New Zealand Dollar" },
    "MYR": { "zh": "馬來西亞幣", "en": "Malaysian Ringgit" },
    "VND": { "zh": "越南盾", "en": "Vietnamese Dong" },
    "PHP": { "zh": "菲律賓披索", "en": "Philippine Peso" },
    "IDR": { "zh": "印尼盾", "en": "Indonesian Rupiah" },
    "INR": { "zh": "印度盧比", "en": "Indian Rupee" },
    "MOP": { "zh": "澳門幣", "en": "Macau Pataca" },
    "SAR": { "zh": "沙烏地里亞爾", "en": "Saudi Riyal" },
    "AED": { "zh": "阿聯酋迪拉姆", "en": "UAE Dirham" },
    "ZAR": { "zh": "南非蘭特", "en": "South African Rand" },
    "TRY": { "zh": "土耳其里拉", "en": "Turkish Lira" },
    "BRL": { "zh": "巴西雷亞爾", "en": "Brazilian Real" },
    "MXN": { "zh": "墨西哥披索", "en": "Mexican Peso" },
    "RUB": { "zh": "俄羅斯盧布", "en": "Russian Ruble" },
    "ILS": { "zh": "以色列新謝克爾", "en": "Israeli New Shekel" },
    "SEK": { "zh": "瑞典克朗", "en": "Swedish Krona" },
    "NOK": { "zh": "挪威克朗", "en": "Norwegian Krone" },
    "DKK": { "zh": "丹麥克朗", "en": "Danish Krone" },
    "PLN": { "zh": "波蘭茲羅提", "en": "Polish Zloty" },
    "HUF": { "zh": "匈牙利福林", "en": "Hungarian Forint" },
    "CZK": { "zh": "捷克克朗", "en": "Czech Koruna" },
    "CLP": { "zh": "智利披索", "en": "Chilean Peso" },
    "COP": { "zh": "哥倫比亞披索", "en": "Colombian Peso" },
    "EGP": { "zh": "埃及鎊", "en": "Egyptian Pound" },
    "KWD": { "zh": "科威特第納爾", "en": "Kuwaiti Dinar" },
    "QAR": { "zh": "卡達里亞爾", "en": "Qatari Riyal" },
    "BHD": { "zh": "巴林第納爾", "en": "Bahraini Dinar" },
    "OMR": { "zh": "阿曼里亞爾", "en": "Omani Rial" },
    "JOD": { "zh": "約旦第納爾", "en": "Jordanian Dinar" },
    "LKR": { "zh": "斯里蘭卡盧比", "en": "Sri Lankan Rupee" },
    "PKR": { "zh": "巴基斯坦盧比", "en": "Pakistani Rupee" },
    "BDT": { "zh": "孟加拉塔卡", "en": "Bangladeshi Taka" },
    "MVR": { "zh": "馬爾地夫盧比", "en": "Maldivian Rufiyaa" },
    "KHR": { "zh": "柬埔寨瑞爾", "en": "Cambodian Riel" },
    "LAK": { "zh": "寮國基普", "en": "Lao Kip" },
    "MMK": { "zh": "緬甸元", "en": "Myanmar Kyat" },
    "BND": { "zh": "汶萊元", "en": "Brunei Dollar" },
    "MNT": { "zh": "蒙古圖格里克", "en": "Mongolian Tugrik" }
};

function getCurrencyName(code, mode) {
    const data = CURRENCY_DICT[code] || { "zh": code, "en": code };
    switch (mode) {
        case 'zh': return data.zh;
        case 'en': return code;
        case 'both': return `${code} ${data.zh}`;
        default: return code;
    }
}