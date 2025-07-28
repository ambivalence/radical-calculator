import { ExpressionParser } from './src/services/ExpressionParser.js'

const parser = new ExpressionParser();
const tokens = parser.tokenize('2 * (x + 3) - sqrt(y)');
console.log('Tokens:', tokens.length);
tokens.forEach((t, i) => console.log(`${i}: ${t.type} - ${t.value}`));
