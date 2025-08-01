import { RadicalExpression } from '@/types'

export interface IVariableManager {
  define(name: string, value: number): void;
  get(name: string): number | undefined;
  getAll(): Map<string, number>;
  delete(name: string): void;
  clear(): void;
  substitute(expression: string): string;
  hasVariable(name: string): boolean;
  
  // New methods for "ans" support
  setLastAnswer(value: number, radicalForm?: RadicalExpression): void;
  getLastAnswer(): number | undefined;
  getLastAnswerRadicalForm(): RadicalExpression | undefined;
  preprocessExpression(expression: string): string;
}

export class VariableManager implements IVariableManager {
  private variables: Map<string, number> = new Map();
  private readonly reservedWords = new Set(['e', 'pi', 'PI', 'ans']);
  private lastAnswer: number | undefined = undefined;
  private lastAnswerRadicalForm: RadicalExpression | undefined = undefined;

  constructor() {
    // Initialize with mathematical constants
    this.variables.set('e', Math.E);
    this.variables.set('pi', Math.PI);
    this.variables.set('PI', Math.PI);
  }

  define(name: string, value: number): void {
    if (!this.isValidVariableName(name)) {
      throw new Error(`Invalid variable name: ${name}`);
    }

    if (this.reservedWords.has(name) && name !== 'ans') {
      throw new Error(`Cannot redefine constant: ${name}`);
    }

    // Handle 'ans' specially
    if (name === 'ans') {
      this.setLastAnswer(value);
      return;
    }

    this.variables.set(name, value);
  }

  get(name: string): number | undefined {
    if (name === 'ans') {
      return this.lastAnswer;
    }
    return this.variables.get(name);
  }

  getAll(): Map<string, number> {
    const allVars = new Map(this.variables);
    if (this.lastAnswer !== undefined) {
      allVars.set('ans', this.lastAnswer);
    }
    return allVars;
  }

  delete(name: string): void {
    if (this.reservedWords.has(name) && name !== 'ans') {
      throw new Error(`Cannot delete constant: ${name}`);
    }
    
    if (name === 'ans') {
      this.lastAnswer = undefined;
      this.lastAnswerRadicalForm = undefined;
      return;
    }
    
    this.variables.delete(name);
  }

  clear(): void {
    // Clear all except constants (keep ans)
    const constants = new Map<string, number>();
    this.reservedWords.forEach(name => {
      if (name === 'ans') return; // Keep ans separate
      const value = this.variables.get(name);
      if (value !== undefined) {
        constants.set(name, value);
      }
    });
    
    this.variables = constants;
  }

  substitute(expression: string): string {
    let result = expression;
    
    // Handle 'ans' first
    if (this.lastAnswer !== undefined) {
      const ansRegex = /\bans\b/g;
      result = result.replace(ansRegex, this.lastAnswer.toString());
    }
    
    // Sort variables by length (descending) to avoid partial replacements
    const sortedVars = Array.from(this.variables.entries())
      .sort((a, b) => b[0].length - a[0].length);
    
    for (const [name, value] of sortedVars) {
      // Use word boundaries to avoid replacing parts of other identifiers
      const regex = new RegExp(`\\b${name}\\b`, 'g');
      result = result.replace(regex, value.toString());
    }
    
    return result;
  }

  hasVariable(name: string): boolean {
    if (name === 'ans') {
      return this.lastAnswer !== undefined;
    }
    return this.variables.has(name);
  }

  setLastAnswer(value: number, radicalForm?: RadicalExpression): void {
    this.lastAnswer = value;
    this.lastAnswerRadicalForm = radicalForm;
  }

  getLastAnswer(): number | undefined {
    return this.lastAnswer;
  }

  getLastAnswerRadicalForm(): RadicalExpression | undefined {
    return this.lastAnswerRadicalForm;
  }

  preprocessExpression(expression: string): string {
    const trimmed = expression.trim();
    
    // If expression starts with an operator and we have a last answer, prepend "ans"
    if (this.lastAnswer !== undefined && this.startsWithOperator(trimmed)) {
      return `ans${trimmed}`;
    }
    
    return trimmed;
  }

  private startsWithOperator(expression: string): boolean {
    // Check if expression starts with a binary operator (not unary minus)
    const operatorRegex = /^[\+\*\/\^]/;
    return operatorRegex.test(expression);
  }

  private isValidVariableName(name: string): boolean {
    // Variable names must start with a letter and contain only letters, numbers, and underscores
    return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(name);
  }
}
