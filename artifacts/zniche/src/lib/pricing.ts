export const PPP_FACTORS: Record<string, number> = {
  US: 1.00, GB: 0.92, DE: 0.88, FR: 0.87, AU: 0.86, CA: 0.85,
  NZ: 0.82, JP: 0.78, SG: 0.75, AE: 0.72, SA: 0.68, KR: 0.66,
  MX: 0.42, BR: 0.40, ZA: 0.38, TH: 0.35, CN: 0.58, RU: 0.45,
  TR: 0.30, AR: 0.25, EG: 0.22, PH: 0.28, VN: 0.26, MY: 0.38,
  NG: 0.18, PK: 0.15, BD: 0.16, IN: 0.20, ID: 0.24, KE: 0.20,
  GH: 0.19, ET: 0.12, TZ: 0.14, UG: 0.13,
};

export function getPPPPrice(usdPrice: number, countryCode: string): number {
  const factor = PPP_FACTORS[countryCode] ?? 0.60;
  const pppPrice = Math.round(usdPrice * factor);
  if (pppPrice < 10) return Math.round(pppPrice);
  if (pppPrice < 50) return Math.round(pppPrice / 5) * 5 - 1;
  return Math.round(pppPrice / 10) * 10 - 1;
}

const RATES_CACHE_KEY = "zniche_rates";
const RATES_CACHE_DURATION = 60 * 60 * 1000;

export const CURRENCY_SYMBOLS: Record<string, string> = {
  PKR: "₨", INR: "₹", GBP: "£", EUR: "€", AUD: "A$", CAD: "C$",
  SAR: "﷼", AED: "د.إ", NGN: "₦", BDT: "৳", EGP: "£E", KES: "KSh",
  MYR: "RM", IDR: "Rp", USD: "$", JPY: "¥", CNY: "¥", KRW: "₩",
  BRL: "R$", MXN: "MX$", ZAR: "R", TRY: "₺", RUB: "₽", ARS: "$",
};

export interface ConvertResult {
  amount: number;
  symbol: string;
  formatted: string;
  rate: number;
}

export async function convertPrice(usdAmount: number, targetCurrency: string): Promise<ConvertResult> {
  if (targetCurrency === "USD") {
    return { amount: usdAmount, symbol: "$", formatted: `$${usdAmount}`, rate: 1 };
  }
  try {
    const cached = localStorage.getItem(RATES_CACHE_KEY);
    let rates: Record<string, number> = {};
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed._ts && Date.now() - parsed._ts < RATES_CACHE_DURATION) {
        rates = parsed.rates || {};
      }
    }
    if (!rates[targetCurrency]) {
      const res = await fetch(`https://api.frankfurter.dev/v2/latest?base=USD&symbols=${targetCurrency}`);
      const data = await res.json();
      rates = { ...rates, ...(data.rates || {}) };
      localStorage.setItem(RATES_CACHE_KEY, JSON.stringify({ rates, _ts: Date.now() }));
    }
    const rate = rates[targetCurrency] || 1;
    const converted = Math.round(usdAmount * rate);
    const sym = CURRENCY_SYMBOLS[targetCurrency] || targetCurrency + " ";
    return { amount: converted, symbol: sym, formatted: `${sym}${converted}`, rate };
  } catch {
    return { amount: usdAmount, symbol: "$", formatted: `$${usdAmount}`, rate: 1 };
  }
}

export function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return "🌍";
  const chars = countryCode.toUpperCase().split("").map(c => 0x1F1E6 + c.charCodeAt(0) - 65);
  return String.fromCodePoint(...chars);
}
