import { VariableManager } from '@/services/VariableManager'

describe('VariableManager', () => {
  let manager: VariableManager;

  beforeEach(() => {
    manager = new VariableManager();
  });

  describe('define', () => {
    test('defines a variable', () => {
      manager.define('x', 5);
      expect(manager.get('x')).toBe(5);
    });

    test('overwrites existing variables', () => {
      manager.define('x', 5);
      manager.define('x', 10);
      expect(manager.get('x')).toBe(10);
    });

    test('throws error for invalid variable names', () => {
      expect(() => manager.define('2x', 5)).toThrow('Invalid variable name');
      expect(() => manager.define('x-y', 5)).toThrow('Invalid variable name');
    });

    test('prevents redefining constants', () => {
      expect(() => manager.define('pi', 3)).toThrow('Cannot redefine constant');
      expect(() => manager.define('e', 2)).toThrow('Cannot redefine constant');
    });
  });

  describe('get', () => {
    test('returns undefined for non-existent variables', () => {
      expect(manager.get('x')).toBeUndefined();
    });

    test('returns mathematical constants', () => {
      expect(manager.get('pi')).toBe(Math.PI);
      expect(manager.get('e')).toBe(Math.E);
    });
  });

  describe('delete', () => {
    test('deletes variables', () => {
      manager.define('x', 5);
      manager.delete('x');
      expect(manager.get('x')).toBeUndefined();
    });

    test('prevents deleting constants', () => {
      expect(() => manager.delete('pi')).toThrow('Cannot delete constant');
    });
  });

  describe('clear', () => {
    test('clears all user-defined variables but keeps constants', () => {
      manager.define('x', 5);
      manager.define('y', 10);
      manager.clear();
      
      expect(manager.get('x')).toBeUndefined();
      expect(manager.get('y')).toBeUndefined();
      expect(manager.get('pi')).toBe(Math.PI);
      expect(manager.get('e')).toBe(Math.E);
    });
  });

  describe('substitute', () => {
    test('substitutes variables in expressions', () => {
      manager.define('x', 5);
      manager.define('y', 3);
      
      expect(manager.substitute('x + y')).toBe('5 + 3');
      expect(manager.substitute('2 * x - y')).toBe('2 * 5 - 3');
    });

    test('handles variables that are substrings of others', () => {
      manager.define('x', 5);
      manager.define('xy', 10);
      
      expect(manager.substitute('xy + x')).toBe('10 + 5');
    });

    test('preserves word boundaries', () => {
      manager.define('x', 5);
      
      expect(manager.substitute('max(x, 2)')).toBe('max(5, 2)');
      expect(manager.substitute('x2 + x')).toBe('x2 + 5');
    });
  });
});
