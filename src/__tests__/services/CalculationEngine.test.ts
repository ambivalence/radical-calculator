import { CalculationEngine } from '@/services/CalculationEngine'
import { ExpressionParser } from '@/services/ExpressionParser'
import { VariableManager } from '@/services/VariableManager'
import { RadicalEngine } from '@/services/RadicalEngine'

describe('CalculationEngine', () => {
  let engine: CalculationEngine;
  let parser: ExpressionParser;
  let variableManager: VariableManager;
  let radicalEngine: RadicalEngine;

  beforeEach(() => {
    parser = new ExpressionParser();
    variableManager = new VariableManager();
    radicalEngine = new RadicalEngine();
    engine = new CalculationEngine(parser, variableManager, radicalEngine);
  });

  describe('evaluate', () => {
    test('evaluates simple arithmetic', () => {
      expect(engine.evaluate('2 + 3').value).toBe(5);
      expect(engine.evaluate('10 - 4').value).toBe(6);
      expect(engine.evaluate('3 * 4').value).toBe(12);
      expect(engine.evaluate('15 / 3').value).toBe(5);
    });

    test('respects order of operations', () => {
      expect(engine.evaluate('2 + 3 * 4').value).toBe(14);
      expect(engine.evaluate('(2 + 3) * 4').value).toBe(20);
    });

    test('handles exponentiation', () => {
      expect(engine.evaluate('2 ^ 3').value).toBe(8);
      expect(engine.evaluate('4 ^ 0.5').value).toBe(2);
    });

    test('evaluates functions', () => {
      expect(engine.evaluate('sqrt(16)').value).toBe(4);
      expect(engine.evaluate('abs(-5)').value).toBe(5);
      expect(engine.evaluate('sin(0)').value).toBe(0);
    });

    test('handles unary minus', () => {
      expect(engine.evaluate('-5').value).toBe(-5);
      expect(engine.evaluate('2 * -3').value).toBe(-6);
    });

    test('uses mathematical constants', () => {
      const piResult = engine.evaluate('2 * pi');
      expect(piResult.value).toBeCloseTo(2 * Math.PI);
      
      const eResult = engine.evaluate('e ^ 2');
      expect(eResult.value).toBeCloseTo(Math.E * Math.E);
    });

    test('returns error for invalid expressions', () => {
      expect(engine.evaluate('2 + + 3').success).toBe(false);
      expect(engine.evaluate('2 + + 3').error).toBeDefined();
    });

    test('returns error for undefined variables', () => {
      const result = engine.evaluate('x + 2');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Undefined variable');
    });

    test('returns error for division by zero', () => {
      const result = engine.evaluate('5 / 0');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Division by zero');
    });
  });

  describe('evaluateWithVariables', () => {
    test('evaluates expressions with variables', () => {
      const vars = new Map([['x', 5], ['y', 3]]);
      expect(engine.evaluateWithVariables('x + y', vars).value).toBe(8);
      expect(engine.evaluateWithVariables('x * y', vars).value).toBe(15);
    });

    test('handles complex expressions with variables', () => {
      const vars = new Map([['a', 4], ['b', 3]]);
      expect(engine.evaluateWithVariables('sqrt(a ^ 2 + b ^ 2)', vars).value).toBe(5);
    });
  });

  describe('radical form conversion', () => {
    test('includes radical form for perfect squares', () => {
      const result = engine.evaluate('sqrt(8)');
      expect(result.success).toBe(true);
      expect(result.value).toBeCloseTo(2.828427);
      expect(result.radicalForm).toBeDefined();
    });
  });
});
