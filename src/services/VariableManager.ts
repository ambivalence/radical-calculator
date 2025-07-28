export interface IVariableManager {
  define(name: string, value: number): void;
  get(name: string): number | undefined;
  getAll(): Map<string, number>;
  delete(name: string): void;
  clear(): void;
  substitute(expression: string): string;
  hasVariable(name: string): boolean;
}

export class VariableManager implements IVariableManager {
  private variables: Map<string, number> = new Map();
  private readonly reservedWords = new Set(['e', 'pi', 'PI']);

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

    if (this.reservedWords.has(name)) {
      throw new Error(`Cannot redefine constant: ${name}`);
    }

    this.variables.set(name, value);
  }

  get(name: string): number | undefined {
    return this.variables.get(name);
  }

  getAll(): Map<string, number> {
    return new Map(this.variables);
  }

  delete(name: string): void {
    if (this.reservedWords.has(name)) {
      throw new Error(`Cannot delete constant: ${name}`);
    }
    this.variables.delete(name);
  }

  clear(): void {
    // Clear all except constants
    const constants = new Map<string, number>();
    this.reservedWords.forEach(name => {
      const value = this.variables.get(name);
      if (value !== undefined) {
        constants.set(name, value);
      }
    });
    
    this.variables = constants;
  }

  substitute(expression: string): string {
    let result = expression;
    
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
    return this.variables.has(name);
  }

  private isValidVariableName(name: string): boolean {
    // Variable names must start with a letter and contain only letters, numbers, and underscores
    return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(name);
  }
}
