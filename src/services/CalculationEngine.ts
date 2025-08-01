import { create, all, MathJsStatic } from 'mathjs'
import { IExpressionParser } from './ExpressionParser'
import { IVariableManager } from './VariableManager'
import { IRadicalEngine } from './RadicalEngine'
import { EvaluationResult, ASTNode, RadicalExpression } from '@/types'

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

      // Evaluate the AST and get both decimal and radical forms
      const { result, radicalForm } = this.evaluateASTWithRadical(parsed.ast, variables);

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

  private evaluateASTWithRadical(node: ASTNode, variables: Map<string, number>): { result: number; radicalForm?: RadicalExpression } {
    switch (node.type) {
      case 'number':
        const num = node.value as number;
        // Convert number to radical expression if it's not an integer
        if (num !== Math.floor(num)) {
          return { result: num };
        }
        return { 
          result: num,
          radicalForm: this.radicalEngine.createRadicalExpression([], num)
        };

      case 'variable':
        const value = variables.get(node.value as string);
        if (value === undefined) {
          throw new Error(`Undefined variable: ${node.value}`);
        }
        return { result: value };

      case 'operator':
        return this.evaluateOperatorWithRadical(node, variables);

      case 'function':
        return this.evaluateFunctionWithRadical(node, variables);

      default:
        throw new Error(`Unknown node type: ${node.type}`);
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

  private evaluateOperatorWithRadical(node: ASTNode, variables: Map<string, number>): { result: number; radicalForm?: RadicalExpression } {
    const operator = node.value as string;

    if (operator === 'u-') {
      // Unary minus
      if (!node.right) throw new Error('Invalid unary minus');
      const right = this.evaluateASTWithRadical(node.right, variables);
      
      let negatedRadicalForm: RadicalExpression | undefined;
      if (right.radicalForm) {
        // Negate all terms and constant
        const negatedTerms = right.radicalForm.terms.map(term => ({
          ...term,
          coefficient: -term.coefficient
        }));
        negatedRadicalForm = this.radicalEngine.createRadicalExpression(negatedTerms, -right.radicalForm.constant);
      }
      
      return { 
        result: -right.result,
        radicalForm: negatedRadicalForm
      };
    }

    // Binary operators
    if (!node.left || !node.right) {
      throw new Error(`Invalid binary operator: ${operator}`);
    }

    const left = this.evaluateASTWithRadical(node.left, variables);
    const right = this.evaluateASTWithRadical(node.right, variables);

    let result: number;
    let radicalForm: RadicalExpression | undefined;

    switch (operator) {
      case '+':
        result = left.result + right.result;
        if (left.radicalForm && right.radicalForm) {
          radicalForm = this.radicalEngine.addRadicalExpressions(left.radicalForm, right.radicalForm);
        } else if (left.radicalForm) {
          // Add right as constant to left radical form
          radicalForm = this.radicalEngine.createRadicalExpression(
            left.radicalForm.terms, 
            left.radicalForm.constant + right.result
          );
        } else if (right.radicalForm) {
          // Add left as constant to right radical form
          radicalForm = this.radicalEngine.createRadicalExpression(
            right.radicalForm.terms, 
            right.radicalForm.constant + left.result
          );
        }
        break;
      case '-':
        result = left.result - right.result;
        if (left.radicalForm && right.radicalForm) {
          // Negate right terms and add
          const negatedRightTerms = right.radicalForm.terms.map(term => ({
            ...term,
            coefficient: -term.coefficient
          }));
          const negatedRight = this.radicalEngine.createRadicalExpression(
            negatedRightTerms, 
            -right.radicalForm.constant
          );
          radicalForm = this.radicalEngine.addRadicalExpressions(left.radicalForm, negatedRight);
        } else if (left.radicalForm) {
          radicalForm = this.radicalEngine.createRadicalExpression(
            left.radicalForm.terms, 
            left.radicalForm.constant - right.result
          );
        } else if (right.radicalForm) {
          const negatedTerms = right.radicalForm.terms.map(term => ({
            ...term,
            coefficient: -term.coefficient
          }));
          radicalForm = this.radicalEngine.createRadicalExpression(
            negatedTerms, 
            left.result - right.radicalForm.constant
          );
        }
        break;
      case '*':
        result = left.result * right.result;
        if (left.radicalForm && right.radicalForm) {
          radicalForm = this.radicalEngine.multiplyRadicalExpressions(left.radicalForm, right.radicalForm);
        } else if (left.radicalForm) {
          // Multiply left radical by right constant
          const scaledTerms = left.radicalForm.terms.map(term => ({
            ...term,
            coefficient: term.coefficient * right.result
          }));
          radicalForm = this.radicalEngine.createRadicalExpression(
            scaledTerms, 
            left.radicalForm.constant * right.result
          );
        } else if (right.radicalForm) {
          // Multiply right radical by left constant
          const scaledTerms = right.radicalForm.terms.map(term => ({
            ...term,
            coefficient: term.coefficient * left.result
          }));
          radicalForm = this.radicalEngine.createRadicalExpression(
            scaledTerms, 
            right.radicalForm.constant * left.result
          );
        }
        break;
      case '/':
        if (right.result === 0) throw new Error('Division by zero');
        result = left.result / right.result;
        // For now, division doesn't preserve radical form unless it's simple
        if (left.radicalForm && !right.radicalForm && right.result !== 0) {
          const scaledTerms = left.radicalForm.terms.map(term => ({
            ...term,
            coefficient: term.coefficient / right.result
          }));
          radicalForm = this.radicalEngine.createRadicalExpression(
            scaledTerms, 
            left.radicalForm.constant / right.result
          );
        }
        break;
      case '^':
        result = Math.pow(left.result, right.result);
        // Handle power operations with radicals
        if (left.radicalForm && Number.isInteger(right.result) && right.result >= 0) {
          radicalForm = this.radicalEngine.powerRadicalExpression(left.radicalForm, right.result);
        }
        break;
      default:
        throw new Error(`Unknown operator: ${operator}`);
    }

    return { result, radicalForm };
  }

  private evaluateFunctionWithRadical(node: ASTNode, variables: Map<string, number>): { result: number; radicalForm?: RadicalExpression } {
    const func = node.value as string;
    const args = node.args || [];

    if (args.length === 0) {
      throw new Error(`Function ${func} requires arguments`);
    }

    const arg = this.evaluateAST(args[0], variables);

    switch (func) {
      case 'sqrt':
        if (arg < 0) throw new Error('Square root of negative number');
        const result = Math.sqrt(arg);
        
        // Create radical expression from simplified radical form
        const radicalForm = this.radicalEngine.simplify(arg);
        const radicalExpression = this.radicalEngine.createRadicalExpression([{
          coefficient: radicalForm.coefficient,
          radicand: radicalForm.radicand
        }]);
        
        return { 
          result,
          radicalForm: radicalExpression
        };
      case 'abs':
        return { result: Math.abs(arg) };
      case 'sin':
        return { result: Math.sin(arg) };
      case 'cos':
        return { result: Math.cos(arg) };
      case 'tan':
        return { result: Math.tan(arg) };
      case 'log':
        if (arg <= 0) throw new Error('Logarithm of non-positive number');
        return { result: Math.log10(arg) };
      case 'ln':
        if (arg <= 0) throw new Error('Natural logarithm of non-positive number');
        return { result: Math.log(arg) };
      default:
        throw new Error(`Unknown function: ${func}`);
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
