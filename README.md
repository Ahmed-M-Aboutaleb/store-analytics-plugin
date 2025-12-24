<p align="center">
  <a href="https://www.medusajs.com">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://user-images.githubusercontent.com/59018053/229103275-b5e482bb-4601-46e6-8142-244f531cebdb.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://user-images.githubusercontent.com/59018053/229103726-e5b529a3-9b3f-4970-8a1f-c6af37f087bf.svg">
    <img alt="Medusa logo" src="https://user-images.githubusercontent.com/59018053/229103726-e5b529a3-9b3f-4970-8a1f-c6af37f087bf.svg">
    </picture>
  </a>
</p>
<h1 align="center">
  Medusa Store Analytics Plugin
</h1>

### Objectives

- Provide a single Admin Analytics Dashboard
- Clear revenue and order health metrics
- Date Range Picker with presets: This Month, Last Month, Last 3 Months, Custom Range (applies to all analytics)
- Charts and KPIs
  - Orders Tab: Total Orders (KPI), Orders Over Time (Line Chart), Total Sales Over Time (Line Chart)
  - Products Tab: Top variants, New Customers by time (Line Chart)
- Tables
  - Orders: Order ID, Date, Country, Subtotal (before tax, checkout currency), Customer Tax (checkout currency), Gross (paid by customer, checkout currency), Stripe Fees (checkout currency)

### UI / Views

1. Analytics Dashboard with two tabs: Orders and Products
2. Orders Table Analytics with the columns above

### Orders Table Analytics

Include a currency selector (USD, AED, KWD, GBP, and the customer payment currency). When an admin selects a currency, all orders are converted using historical exchange rates. If no currency is selected, totals display in the original currencies from the table.

### Challenges

1. N+1 API Problem: Stripe fees sit behind `/admin/orders/:id/stripe-fees`.
2. Currency Normalization: Need historical exchange rates to convert mixed currencies into a single reporting currency.
3. Old Orders Sync: Ensure historical order data is accurately imported and synchronized with current analytics.

### Solving Challenges

#### Challenge 1: The N+1 Stripe Fees Problem

- Problem: Fetching fees for 50 orders requires 1 call to Medusa + 50 calls to Stripe.
- Solution: Event-driven write-side optimization. Listen to `payment.captured`, fetch the Stripe fee once, and store `metadata.stripe_fee` and `metadata.stripe_currency` on the order. The analytics query then reads fees directly with no extra API calls.

#### Challenge 2: Currency Normalization (Historical Rates)

- Problem: An order of EUR 100 from last month is not worth the same in USD today.
- Solution: Historical rate caching via a `CurrencyNormalizationService`. Use a provider such as OpenExchangeRates or Fixer.io. Cache by source currency, target currency, and order date (Redis or DB). When requested, check cache first; if missing, fetch and store. Conversion formula: Reported Value = (Order Value / Source Rate on Date) \* Target Rate on Date.

#### Challenge 3: Old Orders Sync

- Backfill historical orders and their Stripe fees. Reuse the same normalization service for past dates to keep analytics consistent with live data.

### Tech Stack

- Medusa.js v2.12.3
