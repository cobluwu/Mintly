# Mintly — Indian Student Finance Companion

Mintly is a portfolio showcase of an Indian university student money companion built around Maya Lin (2nd Year B.Tech, hostel resident managing monthly pocket money, tutoring payouts, UPI splits, and goal vaults in INR `₹`).

> **Demo Notice**: All balances, UPI VPAs, QR payloads, bank SMS alerts, and payment flows in this app run on deterministic demo data and local/cloud sandbox storage. Mintly does not initiate real money movement or connect to live bank accounts.

---

## Core Capabilities

- **Integer Paise Accounting (`₹`)**: Every balance, budget, split share, and ₹10 round-up is stored in integer paise and formatted with Indian digit grouping (`₹1,14,900`, compact `₹1.15L`) and IST timestamps (`14 Nov`, Monday-start weeks).
- **Allowance Runway & 7-Day Pulse**: Calculates liquid balance minus reserved monthly hostel mess, mobile recharge, and semester fee bills to derive daily safe-to-spend.
- **Tactile Expense & UPI QR Logging**: Custom animated numpad, simulated `upi://pay` QR scanner, bank SMS / CSV idempotent importer, and Jar-style ₹10 auto round-ups into savings vaults.
- **Circles (Splitwise + UPI Settle & WhatsApp Remind)**: Supports **Equal**, **Exact ₹**, **Percent %**, and **Shares** split modes with exact paise conservation, simulated UPI settlement sheets, and pre-filled `wa.me` reminders.
- **Mochi AI Coach (`@google/genai`)**: Server-side grounded in a live INR JSON snapshot of the student's accounts, bills, budgets, round-ups, vaults, and circles, supporting both **English** and **Hinglish** with clear separation of confirmed ledger facts vs. estimates.
- **Gamified Mint Coins & Monthly Money Report**: Rewards transactions, vault boosts, and UPI settlements with Mint Coins that unlock inline SVG accessories on Mochi, alongside month-over-month spend reporting and campus calendar nudges.

---

## How this would connect to real data in production

Moving Mintly from a portfolio simulation to a regulated Indian consumer fintech app would replace each mock/simulated boundary with India's public digital public infrastructure (DPI) and RBI-compliant partners:

1. **Bank & Account Balances → RBI Account Aggregator (AA) Ecosystem**
   - Integrate with a licensed **TSP / FIU** (such as Setu, Finvu, OneMoney, or Perfios) using the **ReBIT Account Aggregator API** specifications.
   - Instead of static seed accounts, the student grants time-bound, revocable **AA Consent Artifacts** to pull encrypted FI (Financial Information) statements across savings accounts, deposits, and recurring mandates via server-side `/api/v1/aa/consent` webhooks.

2. **Payments & Circle Settlements → NPCI UPI Intent & PSP SDK**
   - Replace the simulated `Settle via UPI` sheet and `Scan QR` simulation with **NPCI UPI Intent (`upi://pay?...&tr=<txnRef>`)** deep links on Android/iOS or **Razorpay / Cashfree / Setu UPI Collect** APIs on web.
   - Server webhooks verify signed `SUCCESS` / `PENDING` / `FAILED` NPCI status callbacks using the 12-digit **RRN / UTR** before marking a Circle debt settled or updating ledger balances.

3. **SMS Auto-Logging → Privacy-First Opt-In Parsing**
   - On Android, use the **Google Play SMS User Consent API** or on-device transactional regex classification (processing only verified bank sender IDs like `VM-HDFCBK`, `AX-SBIPSG`, never reading personal OTPs or chats) and posting structured `{ merchant, amountPaise, upiRef }` events to `/api/v1/import` with `idempotencyKey = upiRef`.

4. **Security, Privacy & Compliance**
   - Enforce **RBI Data Localization** (all PII and FI payloads stored strictly in `asia-south1` / Mumbai regions), **token-encrypted KMS keys** for AA decryption, **DPDP Act 2023** explicit consent logs, and **Zero-LLM PII leakage** (strip account numbers, full names, and VPAs before sending aggregated category totals to Gemini).
