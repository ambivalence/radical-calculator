  private evaluateAST(node: ASTNode, variables: Map<string, number>): number {
    if (!node) {
      throw new Error('Invalid AST node');
    }

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
