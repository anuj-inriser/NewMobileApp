export const latestPrices = {}; // { SYMBOL: {price, ts,...} }

export function applyPriceMessage(msg) {
  if (msg?.type !== "PRICE") return;

  latestPrices[msg.symbol] = {
    price: msg.price,
    ts: msg.ts,
    exchange: msg.exchange
  };
}
