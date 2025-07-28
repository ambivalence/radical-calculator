import { ParsedExpression, Token, TokenType, ASTNode, ValidationResult, ValidationError } from '@/types'

export interface IExpressionParser {
  parse(expression: string): ParsedExpression;
  validate(expression: string): ValidationResult;
  tokenize(expression: string): Token[];
}

export class ExpressionParser implements IExpressionParser {
  private readonly operators = new Set(['+', '-', '*', '/', '^']);
  private readonly functions = new Set(['sqrt', 'abs', 'sin', 'cos', 'tan', 'log', 'ln']);
  private readonly precedence: Record<string, number> = {
    '+': 1,
    '-': 1,
    '*': 2,
    '/': 2,
    '^': 3,
    'u-': 4, // Unary minus has higher precedence
  };

  parse(expression: string): ParsedExpression {
    try {
      const tokens = this.tokenize(expression);
      const validation = this.validateTokens(tokens);
      
      if (!validation.isValid) {
        return {
          tokens,
          ast: null,
          variables: this.extractVariables(tokens),
          isValid: false,
          error: validation.errors[0]?.message
        };
      }

      const ast = this.buildAST(tokens);
      
      return {
        tokens,
        ast,
        variables: this.extractVariables(tokens),
        isValid: true
      };
    } catch (error) {
      return {
        tokens: [],
        ast: null,
        variables: [],
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown parsing error'
      };
    }
  }

  validate(expression: string): ValidationResult {
    try {
      const tokens = this.tokenize(expression);
      return this.validateTokens(tokens);
    } catch (error) {
      return {
        isValid: false,
        errors: [{
          message: error instanceof Error ? error.message : 'Unknown error',
          position: 0,
          type: 'syntax'
        }]
      };
    }
  }

  tokenize(expression: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;

    while (i < expression.length) {
      const char = expression[i];

      // Skip whitespace
      if (/\s/.test(char)) {
        i++;
        continue;
      }

      // Numbers (including decimals)
      if (/\d/.test(char) || (char === '.' && i + 1 < expression.length && /\d/.test(expression[i + 1]))) {
        let number = '';
        let hasDecimal = false;
        
        while (i < expression.length && (/\d/.test(expression[i]) || (expression[i] === '.' && !hasDecimal))) {
          if (expression[i] === '.') hasDecimal = true;
          number += expression[i];
          i++;
        }
        
        tokens.push({ type: TokenType.NUMBER, value: number, position: i - number.length });
        continue;
      }

      // Variables and functions
      if (/[a-zA-Z]/.test(char)) {
        let identifier = '';
        const startPos = i;
        
        while (i < expression.length && /[a-zA-Z0-9_]/.test(expression[i])) {
          identifier += expression[i];
          i++;
        }
        
        if (this.functions.has(identifier)) {
          tokens.push({ type: TokenType.FUNCTION, value: identifier, position: startPos });
        } else {
          tokens.push({ type: TokenType.VARIABLE, value: identifier, position: startPos });
        }
        continue;
      }

      // Operators
      if (this.operators.has(char)) {
        // Handle negative numbers
        if (char === '-' && (tokens.length === 0 || 
            tokens[tokens.length - 1].type === TokenType.OPERATOR ||
            tokens[tokens.length - 1].type === TokenType.PARENTHESIS_OPEN)) {
          // This is a unary minus
          tokens.push({ type: TokenType.OPERATOR, value: 'u-', position: i });
        } else {
          tokens.push({ type: TokenType.OPERATOR, value: char, position: i });
        }
        i++;
        continue;
      }

      // Parentheses
      if (char === '(') {
        tokens.push({ type: TokenType.PARENTHESIS_OPEN, value: char, position: i });
        i++;
        continue;
      }

      if (char === ')') {
        tokens.push({ type: TokenType.PARENTHESIS_CLOSE, value: char, position: i });
        i++;
        continue;
      }

      // Comma (for function arguments)
      if (char === ',') {
        tokens.push({ type: TokenType.COMMA, value: char, position: i });
        i++;
        continue;
      }

      // Unknown character
      throw new Error(`Unknown character '${char}' at position ${i}`);
    }

    return tokens;
  }

  private validateTokens(tokens: Token[]): ValidationResult {
    const errors: ValidationError[] = [];
    let parenthesisCount = 0;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const prevToken = i > 0 ? tokens[i - 1] : null;
      const nextToken = i < tokens.length - 1 ? tokens[i + 1] : null;

      // Check parenthesis matching
      if (token.type === TokenType.PARENTHESIS_OPEN) {
        parenthesisCount++;
      } else if (token.type === TokenType.PARENTHESIS_CLOSE) {
        parenthesisCount--;
        if (parenthesisCount < 0) {
          errors.push({
            message: 'Unmatched closing parenthesis',
            position: token.position,
            type: 'syntax'
          });
        }
      }

      // Validate operator placement
      if (token.type === TokenType.OPERATOR && token.value !== 'u-') {
        if (!prevToken || prevToken.type === TokenType.OPERATOR) {
          errors.push({
            message: `Invalid operator placement for '${token.value}'`,
            position: token.position,
            type: 'syntax'
          });
        }
        if (!nextToken || (nextToken.type === TokenType.OPERATOR && nextToken.value !== 'u-')) {
          errors.push({
            message: `Operator '${token.value}' requires an operand`,
            position: token.position,
            type: 'syntax'
          });
        }
      }

      // Validate function calls
      if (token.type === TokenType.FUNCTION) {
        if (!nextToken || nextToken.type !== TokenType.PARENTHESIS_OPEN) {
          errors.push({
            message: `Function '${token.value}' must be followed by parentheses`,
            position: token.position,
            type: 'syntax'
          });
        }
      }
    }

    // Check for unclosed parentheses
    if (parenthesisCount > 0) {
      errors.push({
        message: 'Unclosed parenthesis',
        position: tokens.length > 0 ? tokens[tokens.length - 1].position : 0,
        type: 'syntax'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private buildAST(tokens: Token[]): ASTNode {
    // Convert infix to postfix using Shunting Yard algorithm
    const postfix = this.infixToPostfix(tokens);
    
    // Build AST from postfix
    return this.postfixToAST(postfix);
  }

  private infixToPostfix(tokens: Token[]): Token[] {
    const output: Token[] = [];
    const operatorStack: Token[] = [];

    for (const token of tokens) {
      switch (token.type) {
        case TokenType.NUMBER:
        case TokenType.VARIABLE:
          output.push(token);
          break;

        case TokenType.FUNCTION:
          operatorStack.push(token);
          break;

        case TokenType.OPERATOR:
          while (operatorStack.length > 0) {
            const top = operatorStack[operatorStack.length - 1];
            if (top.type === TokenType.PARENTHESIS_OPEN) break;
            
            if (top.type === TokenType.FUNCTION ||
                (top.type === TokenType.OPERATOR && 
                 this.getPrecedence(top.value) >= this.getPrecedence(token.value))) {
              output.push(operatorStack.pop()!);
            } else {
              break;
            }
          }
          operatorStack.push(token);
          break;

        case TokenType.COMMA:
          while (operatorStack.length > 0 && 
                 operatorStack[operatorStack.length - 1].type !== TokenType.PARENTHESIS_OPEN) {
            output.push(operatorStack.pop()!);
          }
          break;

        case TokenType.PARENTHESIS_OPEN:
          operatorStack.push(token);
          break;

        case TokenType.PARENTHESIS_CLOSE:
          while (operatorStack.length > 0 && 
                 operatorStack[operatorStack.length - 1].type !== TokenType.PARENTHESIS_OPEN) {
            output.push(operatorStack.pop()!);
          }
          operatorStack.pop(); // Remove the opening parenthesis
          
          // If there's a function before the parenthesis, pop it
          if (operatorStack.length > 0 && 
              operatorStack[operatorStack.length - 1].type === TokenType.FUNCTION) {
            output.push(operatorStack.pop()!);
          }
          break;
      }
    }

    // Pop remaining operators
    while (operatorStack.length > 0) {
      output.push(operatorStack.pop()!);
    }

    return output;
  }

  private postfixToAST(postfix: Token[]): ASTNode {
    const stack: ASTNode[] = [];

    for (const token of postfix) {
      switch (token.type) {
        case TokenType.NUMBER:
          stack.push({
            type: 'number',
            value: parseFloat(token.value)
          });
          break;

        case TokenType.VARIABLE:
          stack.push({
            type: 'variable',
            value: token.value
          });
          break;

        case TokenType.OPERATOR:
          if (token.value === 'u-') {
            // Unary minus
            const operand = stack.pop();
            if (!operand) throw new Error('Invalid expression: missing operand for unary minus');
            
            stack.push({
              type: 'operator',
              value: 'u-',
              right: operand
            });
          } else {
            // Binary operator
            const right = stack.pop();
            const left = stack.pop();
            if (!left || !right) throw new Error('Invalid expression: missing operands');
            
            stack.push({
              type: 'operator',
              value: token.value,
              left,
              right
            });
          }
          break;

        case TokenType.FUNCTION:
          // For now, assume single argument functions
          const arg = stack.pop();
          if (!arg) throw new Error('Invalid expression: missing function argument');
          
          stack.push({
            type: 'function',
            value: token.value,
            args: [arg]
          });
          break;
      }
    }

    if (stack.length !== 1) {
      throw new Error('Invalid expression: incomplete evaluation');
    }

    return stack[0];
  }

  private getPrecedence(operator: string): number {
    return this.precedence[operator] || 0;
  }

  private extractVariables(tokens: Token[]): string[] {
    const variables = new Set<string>();
    
    for (const token of tokens) {
      if (token.type === TokenType.VARIABLE) {
        variables.add(token.value);
      }
    }
    
    return Array.from(variables);
  }
}
