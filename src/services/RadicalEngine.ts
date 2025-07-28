import { RadicalForm, RadicalTerm } from '@/types'

export interface IRadicalEngine {
  simplify(value: number): RadicalForm;
  convertToRadical(decimal: number, precision?: number): RadicalForm;
  radicalToString(radical: RadicalForm): string;
}

export class RadicalEngine implements IRadicalEngine {
  /**
   * Simplify a number into its radical form
   * Example: simplify(8) returns { coefficient: 2, radicand: 2 }
   */
  simplify(value: number): RadicalForm {
    if (value === 0) {
      return this.createRadicalForm(0, 1, false);
    }

    const isNegative = value < 0;
    const absValue = Math.abs(value);
    
    // Check if it's a perfect square
    const sqrt = Math.sqrt(absValue);
    if (Number.isInteger(sqrt)) {
      return this.createRadicalForm(isNegative ? -sqrt : sqrt, 1, false);
    }

    // Factor and simplify
    const factors = this.primeFactorization(absValue);
    const { coefficient, radicand } = this.extractPerfectSquares(factors);

    return this.createRadicalForm(
      isNegative ? -coefficient : coefficient,
      radicand,
      false
    );
  }

  /**
   * Convert a decimal to its radical form
   * Uses continued fractions to find the best radical approximation
   */
  convertToRadical(decimal: number, precision: number = 0.0001): RadicalForm {
    // First check if it's already a perfect square
    const directRadical = this.simplify(decimal * decimal);
    if (Math.abs(directRadical.coefficient * Math.sqrt(directRadical.radicand) - decimal) < precision) {
      return this.simplify(decimal * decimal);
    }

    // Try to find a radical form by checking common patterns
    // Check if decimal² is a rational number that can be expressed as a fraction
    const squared = decimal * decimal;
    const fraction = this.decimalToFraction(squared, precision);
    
    if (fraction) {
      // √(a/b) = √a / √b
      const numeratorRadical = this.simplify(fraction.numerator);
      const denominatorRadical = this.simplify(fraction.denominator);
      
      // Rationalize if needed
      if (denominatorRadical.radicand !== 1) {
        // Multiply by √denominator.radicand / √denominator.radicand
        const multiplier = denominatorRadical.radicand;
        numeratorRadical.coefficient *= Math.sqrt(multiplier);
        numeratorRadical.radicand *= multiplier;
        denominatorRadical.coefficient *= Math.sqrt(multiplier);
        denominatorRadical.radicand = 1;
      }

      return this.createRadicalForm(
        numeratorRadical.coefficient / denominatorRadical.coefficient,
        numeratorRadical.radicand,
        false
      );
    }

    // If no good radical form found, return the decimal as is
    return this.createRadicalForm(decimal, 1, false);
  }

  /**
   * Convert a radical form to its string representation
   */
  radicalToString(radical: RadicalForm): string {
    if (radical.isImaginary) {
      if (radical.coefficient === 0) return '0';
      if (radical.coefficient === 1 && radical.radicand === 1) return 'i';
      if (radical.coefficient === -1 && radical.radicand === 1) return '-i';
      if (radical.radicand === 1) return `${radical.coefficient}i`;
      if (radical.coefficient === 1) return `i√${radical.radicand}`;
      if (radical.coefficient === -1) return `-i√${radical.radicand}`;
      return `${radical.coefficient}i√${radical.radicand}`;
    }

    if (radical.radicand === 1) {
      return radical.coefficient.toString();
    }

    if (radical.coefficient === 1) {
      return `√${radical.radicand}`;
    }

    if (radical.coefficient === -1) {
      return `-√${radical.radicand}`;
    }

    return `${radical.coefficient}√${radical.radicand}`;
  }

  /**
   * Prime factorization of a number
   */
  private primeFactorization(n: number): number[] {
    const factors: number[] = [];
    let num = n;

    // Check for 2s
    while (num % 2 === 0) {
      factors.push(2);
      num /= 2;
    }

    // Check odd numbers from 3
    for (let i = 3; i * i <= num; i += 2) {
      while (num % i === 0) {
        factors.push(i);
        num /= i;
      }
    }

    // If num is still greater than 2, it's prime
    if (num > 2) {
      factors.push(num);
    }

    return factors;
  }

  /**
   * Extract perfect squares from prime factors
   */
  private extractPerfectSquares(factors: number[]): { coefficient: number; radicand: number } {
    const factorCounts = new Map<number, number>();
    
    // Count occurrences of each factor
    factors.forEach(factor => {
      factorCounts.set(factor, (factorCounts.get(factor) || 0) + 1);
    });

    let coefficient = 1;
    let radicand = 1;

    // Extract pairs (perfect squares) and singles
    factorCounts.forEach((count, factor) => {
      const pairs = Math.floor(count / 2);
      const remainder = count % 2;

      coefficient *= Math.pow(factor, pairs);
      if (remainder > 0) {
        radicand *= factor;
      }
    });

    return { coefficient, radicand };
  }

  /**
   * Convert decimal to fraction using continued fractions
   */
  private decimalToFraction(decimal: number, precision: number): { numerator: number; denominator: number } | null {
    const maxDenominator = 10000;
    let bestNumerator = Math.round(decimal);
    let bestDenominator = 1;
    let bestError = Math.abs(decimal - bestNumerator);

    for (let denominator = 1; denominator <= maxDenominator; denominator++) {
      const numerator = Math.round(decimal * denominator);
      const value = numerator / denominator;
      const error = Math.abs(decimal - value);

      if (error < bestError && error < precision) {
        bestNumerator = numerator;
        bestDenominator = denominator;
        bestError = error;
      }
    }

    if (bestError < precision) {
      return { numerator: bestNumerator, denominator: bestDenominator };
    }

    return null;
  }

  /**
   * Create a RadicalForm object
   */
  private createRadicalForm(coefficient: number, radicand: number, isImaginary: boolean): RadicalForm {
    return {
      coefficient,
      radicand,
      isImaginary,
      toString: () => this.radicalToString({ coefficient, radicand, isImaginary, toString: () => '' })
    };
  }
}
