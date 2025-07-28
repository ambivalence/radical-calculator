import { RadicalEngine } from '@/services/RadicalEngine'

describe('RadicalEngine', () => {
  let engine: RadicalEngine;

  beforeEach(() => {
    engine = new RadicalEngine();
  });

  describe('simplify', () => {
    test('simplifies perfect squares', () => {
      expect(engine.simplify(4)).toEqual({
        coefficient: 2,
        radicand: 1,
        isImaginary: false,
        toString: expect.any(Function)
      });

      expect(engine.simplify(9)).toEqual({
        coefficient: 3,
        radicand: 1,
        isImaginary: false,
        toString: expect.any(Function)
      });
    });

    test('simplifies numbers with square factors', () => {
      const result = engine.simplify(8);
      expect(result.coefficient).toBe(2);
      expect(result.radicand).toBe(2);
      expect(result.isImaginary).toBe(false);
    });

    test('handles prime numbers', () => {
      const result = engine.simplify(7);
      expect(result.coefficient).toBe(1);
      expect(result.radicand).toBe(7);
    });

    test('handles zero', () => {
      const result = engine.simplify(0);
      expect(result.coefficient).toBe(0);
      expect(result.radicand).toBe(1);
    });

    test('handles negative numbers', () => {
      const result = engine.simplify(-8);
      expect(result.coefficient).toBe(-2);
      expect(result.radicand).toBe(2);
    });

    test('simplifies complex cases', () => {
      const result = engine.simplify(72);
      expect(result.coefficient).toBe(6);
      expect(result.radicand).toBe(2);
    });
  });

  describe('radicalToString', () => {
    test('formats simple radicals correctly', () => {
      expect(engine.radicalToString({ coefficient: 2, radicand: 3, isImaginary: false, toString: () => '' }))
        .toBe('2√3');
    });

    test('formats coefficient 1 correctly', () => {
      expect(engine.radicalToString({ coefficient: 1, radicand: 5, isImaginary: false, toString: () => '' }))
        .toBe('√5');
    });

    test('formats coefficient -1 correctly', () => {
      expect(engine.radicalToString({ coefficient: -1, radicand: 5, isImaginary: false, toString: () => '' }))
        .toBe('-√5');
    });

    test('formats integers correctly', () => {
      expect(engine.radicalToString({ coefficient: 5, radicand: 1, isImaginary: false, toString: () => '' }))
        .toBe('5');
    });

    test('formats imaginary numbers correctly', () => {
      expect(engine.radicalToString({ coefficient: 2, radicand: 3, isImaginary: true, toString: () => '' }))
        .toBe('2i√3');
      
      expect(engine.radicalToString({ coefficient: 1, radicand: 1, isImaginary: true, toString: () => '' }))
        .toBe('i');
    });
  });

  describe('convertToRadical', () => {
    test('converts perfect square roots', () => {
      const result = engine.convertToRadical(2); // √4
      expect(result.coefficient).toBe(2);
      expect(result.radicand).toBe(1);
    });

    test('converts decimal approximations of radicals', () => {
      const result = engine.convertToRadical(1.4142135623730951); // √2
      expect(Math.abs(result.coefficient * Math.sqrt(result.radicand) - 1.4142135623730951)).toBeLessThan(0.0001);
    });
  });
});
