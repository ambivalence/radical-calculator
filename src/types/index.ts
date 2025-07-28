// Core type definitions for the calculator app

export interface CalculationResult {
  expression: string;
  variables: Map<string, number>;
  decimalResult: number;
  radicalResult: RadicalForm | null;
  timestamp: Date;
}

export interface RadicalForm {
  coefficient: number;
  radicand: number;
  numerator?: RadicalTerm;
  denominator?: RadicalTerm;
  isImaginary: boolean;
  toString(): string;
}

export interface RadicalTerm {
  constant: number;
  radicals: Array<{
    coefficient: number;
    radicand: number;
  }>;
}

export interface ParsedExpression {
  tokens: Token[];
  ast: ASTNode | null;
  variables: string[];
  isValid: boolean;
  error?: string;
}

export interface Token {
  type: TokenType;
  value: string;
  position: number;
}

export enum TokenType {
  NUMBER = 'NUMBER',
  OPERATOR = 'OPERATOR',
  VARIABLE = 'VARIABLE',
  FUNCTION = 'FUNCTION',
  PARENTHESIS_OPEN = 'PARENTHESIS_OPEN',
  PARENTHESIS_CLOSE = 'PARENTHESIS_CLOSE',
  COMMA = 'COMMA',
}

export interface ASTNode {
  type: 'number' | 'variable' | 'operator' | 'function';
  value: string | number;
  left?: ASTNode;
  right?: ASTNode;
  args?: ASTNode[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  message: string;
  position: number;
  type: 'syntax' | 'undefined_variable' | 'invalid_operation';
}

export interface EvaluationResult {
  success: boolean;
  value?: number;
  decimalForm?: number;
  radicalForm?: RadicalForm;
  error?: string;
}

export type DisplayMode = 'decimal' | 'radical';

export interface AppState {
  currentExpression: string;
  cursorPosition: number;
  lastResult: CalculationResult | null;
  displayMode: DisplayMode;
  variables: Map<string, number>;
  history: CalculationResult[];
  historyIndex: number;
  showVariablePanel: boolean;
  showHistoryPanel: boolean;
  errorMessage: string | null;
}
