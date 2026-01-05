import { CurrencyNormalizationService } from "../types";

class FawazAhmedConverter implements CurrencyNormalizationService {
  private readonly baseUrl =
    "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api";

  // Cache for successful rates: key = "YYYY-MM-DD|usd|eur"
  private readonly cache = new Map<string, number>();

  // Deduplication map: stores ongoing promises to prevent parallel duplicate fetches
  private readonly pendingRequests = new Map<string, Promise<number>>();

  private async fetchRate(
    base: string,
    target: string,
    date: string
  ): Promise<number> {
    const baseLower = base.toLowerCase();
    const targetLower = target.toLowerCase();

    // 1. Try Date-Specific Endpoint
    let url = `${this.baseUrl}@${date}/v1/currencies/${baseLower}.json`;
    let res = await fetch(url, { headers: { accept: "application/json" } });

    // 2. Fallback to 'latest' if date not found (404)
    if (res.status === 404) {
      console.warn(
        `[Currency] Rate for ${date} not found, falling back to latest.`
      );
      url = `${this.baseUrl}@latest/v1/currencies/${baseLower}.json`;
      res = await fetch(url, { headers: { accept: "application/json" } });
    }

    if (!res.ok) {
      throw new Error(`Currency API request failed: ${res.status}`);
    }

    const data = await res.json();
    const rate = data?.[baseLower]?.[targetLower];

    if (typeof rate !== "number" || !Number.isFinite(rate)) {
      throw new Error(
        `Currency API missing rate for ${baseLower}->${targetLower}`
      );
    }

    return rate;
  }

  async convert(
    amount: number,
    from: string,
    to: string,
    at: Date
  ): Promise<number> {
    if (!Number.isFinite(amount)) return amount;
    if (from === to) return amount;

    const fromCode = from.toLowerCase();
    const toCode = to.toLowerCase();

    // Clamp date: never ask for future rates
    const todayIso = new Date().toLocaleDateString("en-CA");
    const requestedDate = at.toLocaleDateString("en-CA");
    const effectiveDate = requestedDate > todayIso ? todayIso : requestedDate;

    // Unique key for this currency pair + date
    const cacheKey = `${effectiveDate}|${fromCode}|${toCode}`;

    // 1. Check Cache (Instant)
    const cachedRate = this.cache.get(cacheKey);
    if (cachedRate !== undefined) {
      return amount * cachedRate;
    }

    // 2. Check Pending Requests (Deduplication)
    // If a request for this key is already in flight, wait for it instead of firing a new one.
    if (this.pendingRequests.has(cacheKey)) {
      const rate = await this.pendingRequests.get(cacheKey)!;
      return amount * rate;
    }

    // 3. Initiate New Request
    const promise = this.fetchRate(fromCode, toCode, effectiveDate)
      .then((rate) => {
        this.cache.set(cacheKey, rate); // Save to permanent cache
        return rate;
      })
      .finally(() => {
        this.pendingRequests.delete(cacheKey); // Cleanup pending map
      });

    this.pendingRequests.set(cacheKey, promise);

    try {
      const rate = await promise;
      return amount * rate;
    } catch (err) {
      console.error("Currency conversion failed", err);
      return amount; // Fallback: return original amount so UI doesn't crash
    }
  }
}

// Fixed naming mismatch (was frankfurterConverter)
export const fawazAhmedConverter = new FawazAhmedConverter();
