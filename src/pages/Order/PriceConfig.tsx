export const PriceOrderConfig = {
  cid: [
    { min: 0, max: 50, price: 90000 },
    { min: 50, max: 100, price: 80000 },
    { min: 100, max: 200, price: 70000 },
    { min: 200, max: null, price: 60000 },
  ],
  minutes: [
    { min: 0, max: 2000, price: 650 },
    { min: 2000, max: 5000, price: 630 },
    { min: 5000, max: 10000, price: 610 },
    { min: 10000, max: 20000, price: 590 },
    { min: 20000, max: 50000, price: 570 },
    { min: 50000, max: 100000, price: 560 },
    { min: 100000, max: null, price: 550 },
  ],
  user: [
    { min: 0, max: 20, price: 70000 },
    { min: 20, max: 50, price: 60000 },
    { min: 50, max: 100, price: 50000 },
    { min: 100, max: null, price: 45000 },
  ],
};

export const getPriceForRange = (
  value: number,
  config: { min: number; max: number | null; price: number }[]
): number => {
  const match = config.find(
    (c) => value > c.min && (c.max === null || value <= c.max)
  );
  return match ? match.price : 0;
};
