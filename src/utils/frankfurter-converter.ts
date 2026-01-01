import { CurrencyNormalizationService } from "../api/admin/analytics/orders/types";

// Lightweight converter backed by https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api
// with simple in-memory caching. The API is versioned by date (YYYY-MM-DD).
class FrankfurterConverter implements CurrencyNormalizationService {
  private readonly baseUrl =
    "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api";
  private readonly cache = new Map<string, number>();

  private async fetchRatesForBase(base: string, date: string) {
    const datedUrl = `${this.baseUrl}@${date}/v1/currencies/${base}.json`;
    let res = await (globalThis as any).fetch(datedUrl, {
      headers: { accept: "application/json" },
    });

    if (res?.status === 404) {
      const latestUrl = `${this.baseUrl}@latest/v1/currencies/${base}.json`;
      res = await (globalThis as any).fetch(latestUrl, {
        headers: { accept: "application/json" },
      });
    }

    if (!res?.ok) {
      throw new Error(`Currency API request failed: ${res?.status ?? ""}`);
    }

    return res.json();
  }

  async convert(
    amount: number,
    from: string,
    to: string,
    at: Date
  ): Promise<number> {
    const fromCode = from.toUpperCase();
    const toCode = to.toUpperCase();
    const fromLower = fromCode.toLowerCase();
    const toLower = toCode.toLowerCase();

    if (!Number.isFinite(amount)) {
      throw new Error("Amount must be a finite number for conversion");
    }
    if (fromCode === toCode) {
      return amount;
    }

    const todayIso = new Date().toISOString().slice(0, 10);
    const requestedDate = at.toISOString().slice(0, 10);
    const effectiveDate = requestedDate > todayIso ? todayIso : requestedDate;
    const cacheKey = `${effectiveDate}|${fromCode}|${toCode}`;
    const cached = this.cache.get(cacheKey);
    if (cached !== undefined) {
      return amount * cached;
    }

    const body = await this.fetchRatesForBase(fromLower, effectiveDate);
    const rate = body?.[fromLower]?.[toLower];
    if (typeof rate !== "number" || !Number.isFinite(rate)) {
      throw new Error("Currency API response missing expected rate");
    }

    this.cache.set(cacheKey, rate);
    return amount * rate;
  }
}

export const frankfurterConverter = new FrankfurterConverter();
