import { create, all, MathJsStatic } from 'mathjs'
import { IExpressionParser } from './ExpressionParser'
import { IVariableManager } from './VariableManager'
import { IRadicalEngine } from './RadicalEngine'
import { EvaluationResult, ASTNode, RadicalForm } from '@/types'

export interface ICalculationEngine {
  evaluate(expression: string): EvaluationResult;
  evaluateWithVariables(expression: string, variables: Map<string, number>): EvaluationResult;
}

export class CalculationEngine implements ICalculationEngine {
  private math: MathJsStatic;

  constructor(
    private parser: IExpressionParser,
    private variableManager: IVariableManager,
    private radicalEngine: IRadicalEngine
  ) {
    this.math = create(all);
    this.configureMathJS();
  }

  evaluate(expression: string): EvaluationResult {
    return this.evaluateWithVariables(expression, this.variableManager.getAll());
  }

  evaluateWithVariables(expression: string, variables: Map<string, number>): EvaluationResult {
    try {
      // Parse the expression
      const parsed = this.parser.parse(expression);
      
      if (!parsed.isValid || !parsed.ast) {
        return {
          success: false,
          error: parsed.error || 'Invalid expression'
        };
      }

      // Check for undefined variables
      const undefinedVars = parsed.variables.filter(v => !variables.has(v));
      if (undefinedVars.length > 0) {
        return {
          success: false,
          error: `Undefined variable(s): ${undefinedVars.join(', ')}`
        };
      }

      // Evaluate the AST
      const result = this.evaluateAST(parsed.ast, variables);
      
      // Try to convert to radical form
      let radicalForm: RadicalForm | undefined;
      try {
        radicalForm = this.radicalEngine.convertToRadical(result);
      } catch {
        // If conversion fails, that's okay
      }

      return {
        success: true,
        value: result,
        decimalForm: result,
        radicalForm
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Calculation error'
      };
    }
  }

  private evaluateAST(node: ASTNode, variables: Map<string, number>): number {
    switch (node.type) {
      case 'number':
        return node.value as number;

      case 'variable':
        const value = variables.get(node.value as string);
        if (value === undefined) {
          throw new Error(`Undefined variable: ${node.value}`);
        }
        return value;

      case 'operator':
        return this.evaluateOperator(node, variables);

      case 'function':
        return this.evaluateFunction(node, variables);

      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  private evaluateOperator(node: ASTNode, variables: Map<string, number>): number {
    const operator = node.value as string;

    if (operator === 'u-') {
      // Unary minus
      if (!node.right) throw new Error('Invalid unary minus');
      return -this.evaluateAST(node.right, variables);
    }

    // Binary operators
    if (!node.left || !node.right) {
      throw new Error(`Invalid binary operator: ${operator}`);
    }

    const left = this.evaluateAST(node.left, variables);
    const right = this.evaluateAST(node.right, variables);

    switch (operator) {
      case '+':
        return left + right;
      case '-':
        return left - right;
      case '*':
        return left * right;
      case '/':
        if (right === 0) throw new Error('Division by zero');
        return left / right;
      case '^':
        return Math.pow(left, right);
      default:
        throw new Error(`Unknown operator: ${operator}`);
    }
  }

  private evaluateFunction(node: ASTNode, variables: Map<string, number>): number {
    const func = node.value as string;
    const args = node.args || [];

    if (args.length === 0) {
      throw new Error(`Function ${func} requires arguments`);
    }

    const arg = this.evaluateAST(args[0], variables);

    switch (func) {
      case 'sqrt':
        if (arg < 0) throw new Error('Square root of negative number');
        return Math.sqrt(arg);
      case 'abs':
        return Math.abs(arg);
      case 'sin':
        return Math.sin(arg);
      case 'cos':
        return Math.cos(arg);
      case 'tan':
        return Math.tan(arg);
      case 'log':
        if (arg <= 0) throw new Error('Logarithm of non-positive number');
        return Math.log10(arg);
      case 'ln':
        if (arg <= 0) throw new Error('Natural logarithm of non-positive number');
        return Math.log(arg);
      default:
        throw new Error(`Unknown function: ${func}`);
    }
  }

  private configureMathJS(): void {
    // Configure math.js settings
    this.math.config({
      number: 'number',
      precision: 64
    });
  }
}
