// Helper functions for mathematical operations

export function isNumeric(value: string): boolean {
  return !isNaN(parseFloat(value)) && isFinite(Number(value));
}

export function roundToPrecision(value: number, precision: number = 10): number {
  return Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision);
}

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    const temp = b;
    b = a % b;
    a = temp;
  }
  return a;
}

export function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}
