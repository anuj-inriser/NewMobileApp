// ws/marketSubscriptions.js
import { sendMarketMessage } from "./marketWs";

/**
 * 🔥 GLOBAL SET
 * 👉 Isme wahi symbols rahenge jo currently subscribed hain
 * 👉 useRealtimePrices isi ko read karega
 */
export const activeSubscribedSymbols = new Set();

const unsubscribeTimers = new Map();
const keyOf = (page, context) => `${page}::${context}`;

/**
 * 🟢 SUBSCRIBE SYMBOLS
 */
export function subscribeSymbols(symbols, page, context) {
  if (!symbols?.length) return;

  const key = keyOf(page, context);

  // ❌ cancel delayed unsubscribe if exists
  if (unsubscribeTimers.has(key)) {
    clearTimeout(unsubscribeTimers.get(key));
    unsubscribeTimers.delete(key);
    console.log(`❌ CANCEL UNSUB → ${key}`);
  }

  // ✅ mark symbols as active
  symbols.forEach((s) => activeSubscribedSymbols.add(s));

  console.log(`🟢 SUBSCRIBE → ${key}`, symbols);

  sendMarketMessage({
    type: "SUBSCRIBE",
    page,
    context,
    symbols,
  });
}

/**
 * 🔴 DELAYED UNSUBSCRIBE (30 sec)
 */
export function unsubscribeDelayed(symbols, page, context) {
  if (!symbols?.length) return;

  const key = keyOf(page, context);
  if (unsubscribeTimers.has(key)) return;

  console.log(`🕒 UNSUBSCRIBE in 30s → ${key}`);

  const timer = setTimeout(() => {
    console.log(`🔴 UNSUBSCRIBED → ${key}`);

    // ❌ remove symbols from active set
    symbols.forEach((s) => activeSubscribedSymbols.delete(s));

    sendMarketMessage({
      type: "UNSUBSCRIBE_DELAYED",
      page,
      context,
      symbols,
    });

    unsubscribeTimers.delete(key);
  }, 30000);

  unsubscribeTimers.set(key, timer);
}
