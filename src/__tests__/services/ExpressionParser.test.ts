import { ExpressionParser } from '@/services/ExpressionParser'
import { TokenType } from '@/types'

describe('ExpressionParser', () => {
  let parser: ExpressionParser;

  beforeEach(() => {
    parser = new ExpressionParser();
  });

  describe('tokenize', () => {
    test('tokenizes simple numbers', () => {
      const tokens = parser.tokenize('42');
      expect(tokens).toHaveLength(1);
      expect(tokens[0]).toEqual({
        type: TokenType.NUMBER,
        value: '42',
        position: 0
      });
    });

    test('tokenizes decimal numbers', () => {
      const tokens = parser.tokenize('3.14');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].value).toBe('3.14');
    });

    test('tokenizes simple expressions', () => {
      const tokens = parser.tokenize('2 + 3');
      expect(tokens).toHaveLength(3);
      expect(tokens[0].type).toBe(TokenType.NUMBER);
      expect(tokens[1].type).toBe(TokenType.OPERATOR);
      expect(tokens[2].type).toBe(TokenType.NUMBER);
    });

    test('tokenizes expressions with variables', () => {
      const tokens = parser.tokenize('x + 2');
      expect(tokens[0].type).toBe(TokenType.VARIABLE);
      expect(tokens[0].value).toBe('x');
    });

    test('tokenizes functions', () => {
      const tokens = parser.tokenize('sqrt(16)');
      expect(tokens[0].type).toBe(TokenType.FUNCTION);
      expect(tokens[0].value).toBe('sqrt');
    });

    test('handles unary minus', () => {
      const tokens = parser.tokenize('-5');
      expect(tokens[0].value).toBe('u-');
      
      const tokens2 = parser.tokenize('2 * -3');
      expect(tokens2[2].value).toBe('u-');
    });

    test('tokenizes complex expressions', () => {
      const tokens = parser.tokenize('2 * (x + 3) - sqrt(y)');
      expect(tokens).toHaveLength(12);
    });
  });

  describe('validate', () => {
    test('validates correct expressions', () => {
      expect(parser.validate('2 + 3').isValid).toBe(true);
      expect(parser.validate('x * (y + 2)').isValid).toBe(true);
      expect(parser.validate('sqrt(16)').isValid).toBe(true);
    });

    test('detects unmatched parentheses', () => {
      const result = parser.validate('2 + (3 * 4');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('Unclosed parenthesis');
    });

    test('detects invalid operator placement', () => {
      const result = parser.validate('2 + + 3');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].type).toBe('syntax');
    });

    test('detects missing function parentheses', () => {
      const result = parser.validate('sqrt 16');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('must be followed by parentheses');
    });
  });

  describe('parse', () => {
    test('parses simple addition', () => {
      const result = parser.parse('2 + 3');
      expect(result.isValid).toBe(true);
      expect(result.ast).toBeDefined();
      expect(result.ast?.type).toBe('operator');
      expect(result.ast?.value).toBe('+');
    });

    test('parses expressions with variables', () => {
      const result = parser.parse('x + 2');
      expect(result.isValid).toBe(true);
      expect(result.variables).toContain('x');
    });

    test('parses function calls', () => {
      const result = parser.parse('sqrt(16)');
      expect(result.isValid).toBe(true);
      expect(result.ast?.type).toBe('function');
      expect(result.ast?.value).toBe('sqrt');
    });

    test('respects operator precedence', () => {
      const result = parser.parse('2 + 3 * 4');
      expect(result.isValid).toBe(true);
      // The AST should have + at the root with 2 on left and (3*4) on right
      expect(result.ast?.type).toBe('operator');
      expect(result.ast?.value).toBe('+');
      expect(result.ast?.right?.type).toBe('operator');
      expect(result.ast?.right?.value).toBe('*');
    });

    test('handles parentheses correctly', () => {
      const result = parser.parse('(2 + 3) * 4');
      expect(result.isValid).toBe(true);
      // The AST should have * at the root with (2+3) on left and 4 on right
      expect(result.ast?.type).toBe('operator');
      expect(result.ast?.value).toBe('*');
      expect(result.ast?.left?.type).toBe('operator');
      expect(result.ast?.left?.value).toBe('+');
    });

    test('returns error for invalid expressions', () => {
      const result = parser.parse('2 + + 3');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
