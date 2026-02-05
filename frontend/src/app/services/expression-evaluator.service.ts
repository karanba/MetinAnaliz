import { Injectable } from '@angular/core';
import Decimal from 'decimal.js';

// Configure Decimal.js for high precision
Decimal.set({ precision: 30, rounding: Decimal.ROUND_HALF_UP });

// Token types
export enum TokenType {
  NUMBER = 'NUMBER',
  IDENTIFIER = 'IDENTIFIER',
  OPERATOR = 'OPERATOR',
  LEFT_PAREN = 'LEFT_PAREN',
  RIGHT_PAREN = 'RIGHT_PAREN',
  COMMA = 'COMMA',
  FACTORIAL = 'FACTORIAL',
}

export interface Token {
  type: TokenType;
  value: string;
  position: number;
}

// Operator precedence and associativity
interface OperatorInfo {
  precedence: number;
  associativity: 'left' | 'right';
  arity: number;
}

const OPERATORS: Record<string, OperatorInfo> = {
  '+': { precedence: 2, associativity: 'left', arity: 2 },
  '-': { precedence: 2, associativity: 'left', arity: 2 },
  '*': { precedence: 3, associativity: 'left', arity: 2 },
  '/': { precedence: 3, associativity: 'left', arity: 2 },
  '%': { precedence: 3, associativity: 'left', arity: 2 },
  '^': { precedence: 4, associativity: 'right', arity: 2 },
  'neg': { precedence: 5, associativity: 'right', arity: 1 }, // Unary minus
};

// Supported functions
const FUNCTIONS = new Set([
  'sin', 'cos', 'tan', 'asin', 'acos', 'atan',
  'sinh', 'cosh', 'tanh',
  'ln', 'log10', 'log', 'exp', 'sqrt', 'abs',
  'floor', 'ceil', 'round',
  'nPr', 'nCr',
]);

// Constants
const CONSTANTS: Record<string, Decimal> = {
  'pi': new Decimal(Math.PI),
  'e': new Decimal(Math.E),
};

export interface EvaluationResult {
  success: boolean;
  value?: Decimal;
  error?: string;
  formattedValue?: string;
}

export type AngleMode = 'DEG' | 'RAD';

@Injectable({
  providedIn: 'root'
})
export class ExpressionEvaluatorService {
  private angleMode: AngleMode = 'RAD';
  private precision: number = 12;
  private scientificNotation: boolean = false;

  setAngleMode(mode: AngleMode): void {
    this.angleMode = mode;
  }

  getAngleMode(): AngleMode {
    return this.angleMode;
  }

  setPrecision(precision: number): void {
    this.precision = Math.min(Math.max(precision, 1), 20);
  }

  getPrecision(): number {
    return this.precision;
  }

  setScientificNotation(enabled: boolean): void {
    this.scientificNotation = enabled;
  }

  getScientificNotation(): boolean {
    return this.scientificNotation;
  }

  /**
   * Tokenize the input expression
   */
  tokenize(expression: string): Token[] {
    const tokens: Token[] = [];
    let pos = 0;

    while (pos < expression.length) {
      const char = expression[pos];

      // Skip whitespace
      if (/\s/.test(char)) {
        pos++;
        continue;
      }

      // Number (including decimals)
      if (/[0-9.]/.test(char)) {
        let num = '';
        const startPos = pos;
        while (pos < expression.length && /[0-9.]/.test(expression[pos])) {
          num += expression[pos];
          pos++;
        }
        // Handle scientific notation in input (e.g., 1e10)
        if (pos < expression.length && /[eE]/.test(expression[pos])) {
          num += expression[pos];
          pos++;
          if (pos < expression.length && /[+-]/.test(expression[pos])) {
            num += expression[pos];
            pos++;
          }
          while (pos < expression.length && /[0-9]/.test(expression[pos])) {
            num += expression[pos];
            pos++;
          }
        }
        tokens.push({ type: TokenType.NUMBER, value: num, position: startPos });
        continue;
      }

      // Identifier (function name or constant)
      if (/[a-zA-Z_]/.test(char)) {
        let identifier = '';
        const startPos = pos;
        while (pos < expression.length && /[a-zA-Z0-9_]/.test(expression[pos])) {
          identifier += expression[pos];
          pos++;
        }
        tokens.push({ type: TokenType.IDENTIFIER, value: identifier, position: startPos });
        continue;
      }

      // Operators and parentheses
      if (char === '(') {
        tokens.push({ type: TokenType.LEFT_PAREN, value: '(', position: pos });
        pos++;
        continue;
      }

      if (char === ')') {
        tokens.push({ type: TokenType.RIGHT_PAREN, value: ')', position: pos });
        pos++;
        continue;
      }

      if (char === ',') {
        tokens.push({ type: TokenType.COMMA, value: ',', position: pos });
        pos++;
        continue;
      }

      if (char === '!') {
        tokens.push({ type: TokenType.FACTORIAL, value: '!', position: pos });
        pos++;
        continue;
      }

      if (['+', '-', '*', '/', '%', '^'].includes(char)) {
        tokens.push({ type: TokenType.OPERATOR, value: char, position: pos });
        pos++;
        continue;
      }

      throw new Error(`Bilinmeyen karakter: '${char}' (pozisyon ${pos})`);
    }

    return tokens;
  }

  /**
   * Insert implicit multiplication tokens
   * Examples: 2pi -> 2*pi, 2(3+4) -> 2*(3+4), sin(x)cos(x) -> sin(x)*cos(x)
   */
  private insertImplicitMultiplication(tokens: Token[]): Token[] {
    const result: Token[] = [];

    for (let i = 0; i < tokens.length; i++) {
      const current = tokens[i];
      const prev = result[result.length - 1];

      if (prev) {
        const needsMultiplication =
          // NUMBER followed by IDENTIFIER, LEFT_PAREN, or NUMBER
          (prev.type === TokenType.NUMBER &&
            (current.type === TokenType.IDENTIFIER ||
              current.type === TokenType.LEFT_PAREN ||
              current.type === TokenType.NUMBER)) ||
          // RIGHT_PAREN followed by NUMBER, IDENTIFIER, or LEFT_PAREN
          (prev.type === TokenType.RIGHT_PAREN &&
            (current.type === TokenType.NUMBER ||
              current.type === TokenType.IDENTIFIER ||
              current.type === TokenType.LEFT_PAREN)) ||
          // IDENTIFIER (constant) followed by NUMBER, IDENTIFIER, or LEFT_PAREN
          (prev.type === TokenType.IDENTIFIER &&
            !FUNCTIONS.has(prev.value) &&
            (current.type === TokenType.NUMBER ||
              current.type === TokenType.IDENTIFIER ||
              current.type === TokenType.LEFT_PAREN)) ||
          // FACTORIAL followed by NUMBER, IDENTIFIER, or LEFT_PAREN
          (prev.type === TokenType.FACTORIAL &&
            (current.type === TokenType.NUMBER ||
              current.type === TokenType.IDENTIFIER ||
              current.type === TokenType.LEFT_PAREN));

        if (needsMultiplication) {
          result.push({ type: TokenType.OPERATOR, value: '*', position: current.position });
        }
      }

      result.push(current);
    }

    return result;
  }

  /**
   * Convert tokens to Reverse Polish Notation using Shunting-yard algorithm
   */
  private toRPN(tokens: Token[]): (Token | { type: 'FUNCTION'; value: string; argCount: number })[] {
    const output: (Token | { type: 'FUNCTION'; value: string; argCount: number })[] = [];
    const operatorStack: (Token | { type: 'FUNCTION_MARKER'; value: string; argCount: number })[] = [];
    const argCountStack: number[] = [];

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (token.type === TokenType.NUMBER) {
        output.push(token);
      } else if (token.type === TokenType.IDENTIFIER) {
        if (FUNCTIONS.has(token.value)) {
          operatorStack.push({ type: 'FUNCTION_MARKER', value: token.value, argCount: 1 });
          argCountStack.push(1);
        } else if (CONSTANTS[token.value]) {
          output.push({ type: TokenType.NUMBER, value: CONSTANTS[token.value].toString(), position: token.position });
        } else {
          throw new Error(`Bilinmeyen tanımlayıcı: '${token.value}'`);
        }
      } else if (token.type === TokenType.OPERATOR) {
        // Check for unary minus
        const prev = tokens[i - 1];
        const isUnary = !prev ||
          prev.type === TokenType.LEFT_PAREN ||
          prev.type === TokenType.OPERATOR ||
          prev.type === TokenType.COMMA;

        if (token.value === '-' && isUnary) {
          operatorStack.push({ ...token, value: 'neg' });
        } else {
          const op1 = OPERATORS[token.value];
          while (operatorStack.length > 0) {
            const top = operatorStack[operatorStack.length - 1];
            if ('type' in top && top.type === 'FUNCTION_MARKER') break;
            if (top.type === TokenType.LEFT_PAREN) break;

            const op2 = OPERATORS[(top as Token).value];
            if (!op2) break;

            if ((op1.associativity === 'left' && op1.precedence <= op2.precedence) ||
              (op1.associativity === 'right' && op1.precedence < op2.precedence)) {
              output.push(operatorStack.pop() as Token);
            } else {
              break;
            }
          }
          operatorStack.push(token);
        }
      } else if (token.type === TokenType.FACTORIAL) {
        // Factorial is a postfix operator with highest precedence
        output.push(token);
      } else if (token.type === TokenType.LEFT_PAREN) {
        operatorStack.push(token);
      } else if (token.type === TokenType.RIGHT_PAREN) {
        while (operatorStack.length > 0 &&
          operatorStack[operatorStack.length - 1].type !== TokenType.LEFT_PAREN &&
          !('type' in operatorStack[operatorStack.length - 1] && (operatorStack[operatorStack.length - 1] as any).type === 'FUNCTION_MARKER')) {
          output.push(operatorStack.pop() as Token);
        }

        if (operatorStack.length === 0) {
          throw new Error('Eşleşmeyen parantez');
        }

        const top = operatorStack[operatorStack.length - 1];
        if (top.type === TokenType.LEFT_PAREN) {
          operatorStack.pop();
        }

        // Check if there's a function on the stack
        if (operatorStack.length > 0) {
          const funcTop = operatorStack[operatorStack.length - 1];
          if ('type' in funcTop && (funcTop as any).type === 'FUNCTION_MARKER') {
            const func = operatorStack.pop() as { type: 'FUNCTION_MARKER'; value: string; argCount: number };
            const argCount = argCountStack.pop() || 1;
            output.push({ type: 'FUNCTION', value: func.value, argCount });
          }
        }
      } else if (token.type === TokenType.COMMA) {
        while (operatorStack.length > 0 &&
          operatorStack[operatorStack.length - 1].type !== TokenType.LEFT_PAREN) {
          const top = operatorStack[operatorStack.length - 1];
          if ('type' in top && (top as any).type === 'FUNCTION_MARKER') break;
          output.push(operatorStack.pop() as Token);
        }
        // Increment argument count
        if (argCountStack.length > 0) {
          argCountStack[argCountStack.length - 1]++;
        }
      }
    }

    while (operatorStack.length > 0) {
      const top = operatorStack.pop()!;
      if (top.type === TokenType.LEFT_PAREN) {
        throw new Error('Eşleşmeyen parantez');
      }
      if ('type' in top && (top as any).type === 'FUNCTION_MARKER') {
        throw new Error('Fonksiyon parantezi eksik');
      }
      output.push(top as Token);
    }

    return output;
  }

  /**
   * Convert angle to radians if in degree mode
   */
  private toRadians(value: Decimal): Decimal {
    if (this.angleMode === 'DEG') {
      return value.times(Decimal.acos(-1)).dividedBy(180);
    }
    return value;
  }

  /**
   * Convert radians to angle if in degree mode
   */
  private fromRadians(value: Decimal): Decimal {
    if (this.angleMode === 'DEG') {
      return value.times(180).dividedBy(Decimal.acos(-1));
    }
    return value;
  }

  /**
   * Calculate factorial
   */
  private factorial(n: Decimal): Decimal {
    if (!n.isInteger() || n.isNegative()) {
      throw new Error('Faktöriyel sadece negatif olmayan tam sayılar için tanımlıdır');
    }
    if (n.greaterThan(170)) {
      throw new Error('Faktöriyel çok büyük (maksimum 170!)');
    }

    let result = new Decimal(1);
    for (let i = new Decimal(2); i.lessThanOrEqualTo(n); i = i.plus(1)) {
      result = result.times(i);
    }
    return result;
  }

  /**
   * Calculate permutation nPr
   */
  private permutation(n: Decimal, r: Decimal): Decimal {
    if (!n.isInteger() || !r.isInteger() || n.isNegative() || r.isNegative()) {
      throw new Error('nPr için n ve r negatif olmayan tam sayılar olmalıdır');
    }
    if (r.greaterThan(n)) {
      return new Decimal(0);
    }
    // nPr = n! / (n-r)!
    let result = new Decimal(1);
    for (let i = n.minus(r).plus(1); i.lessThanOrEqualTo(n); i = i.plus(1)) {
      result = result.times(i);
    }
    return result;
  }

  /**
   * Calculate combination nCr
   */
  private combination(n: Decimal, r: Decimal): Decimal {
    if (!n.isInteger() || !r.isInteger() || n.isNegative() || r.isNegative()) {
      throw new Error('nCr için n ve r negatif olmayan tam sayılar olmalıdır');
    }
    if (r.greaterThan(n)) {
      return new Decimal(0);
    }
    // nCr = n! / (r! * (n-r)!)
    // Optimize: nCr = nPr / r!
    return this.permutation(n, r).dividedBy(this.factorial(r));
  }

  /**
   * Evaluate a function with given arguments
   */
  private evaluateFunction(name: string, args: Decimal[]): Decimal {
    switch (name) {
      case 'sin':
        return new Decimal(Math.sin(this.toRadians(args[0]).toNumber()));
      case 'cos':
        return new Decimal(Math.cos(this.toRadians(args[0]).toNumber()));
      case 'tan': {
        const radians = this.toRadians(args[0]).toNumber();
        const result = Math.tan(radians);
        if (!isFinite(result)) {
          throw new Error('tan tanımsız (90° veya 270° gibi değerler için)');
        }
        return new Decimal(result);
      }
      case 'asin': {
        if (args[0].lessThan(-1) || args[0].greaterThan(1)) {
          throw new Error('asin için değer -1 ile 1 arasında olmalıdır');
        }
        return this.fromRadians(new Decimal(Math.asin(args[0].toNumber())));
      }
      case 'acos': {
        if (args[0].lessThan(-1) || args[0].greaterThan(1)) {
          throw new Error('acos için değer -1 ile 1 arasında olmalıdır');
        }
        return this.fromRadians(new Decimal(Math.acos(args[0].toNumber())));
      }
      case 'atan':
        return this.fromRadians(new Decimal(Math.atan(args[0].toNumber())));
      case 'sinh':
        return new Decimal(Math.sinh(args[0].toNumber()));
      case 'cosh':
        return new Decimal(Math.cosh(args[0].toNumber()));
      case 'tanh':
        return new Decimal(Math.tanh(args[0].toNumber()));
      case 'ln': {
        if (args[0].lessThanOrEqualTo(0)) {
          throw new Error('ln için değer pozitif olmalıdır');
        }
        return args[0].ln();
      }
      case 'log10':
      case 'log': {
        if (args[0].lessThanOrEqualTo(0)) {
          throw new Error('log için değer pozitif olmalıdır');
        }
        return args[0].log(10);
      }
      case 'exp':
        return args[0].exp();
      case 'sqrt': {
        if (args[0].isNegative()) {
          throw new Error('Negatif sayının karekökü alınamaz');
        }
        return args[0].sqrt();
      }
      case 'abs':
        return args[0].abs();
      case 'floor':
        return args[0].floor();
      case 'ceil':
        return args[0].ceil();
      case 'round':
        return args[0].round();
      case 'nPr':
        if (args.length < 2) throw new Error('nPr iki argüman gerektirir');
        return this.permutation(args[0], args[1]);
      case 'nCr':
        if (args.length < 2) throw new Error('nCr iki argüman gerektirir');
        return this.combination(args[0], args[1]);
      default:
        throw new Error(`Bilinmeyen fonksiyon: '${name}'`);
    }
  }

  /**
   * Evaluate RPN expression
   */
  private evaluateRPN(rpn: (Token | { type: 'FUNCTION'; value: string; argCount: number })[]): Decimal {
    const stack: Decimal[] = [];

    for (const item of rpn) {
      if ('position' in item && item.type === TokenType.NUMBER) {
        stack.push(new Decimal(item.value));
      } else if ('position' in item && item.type === TokenType.FACTORIAL) {
        if (stack.length < 1) {
          throw new Error('Faktöriyel için yetersiz operand');
        }
        const operand = stack.pop()!;
        stack.push(this.factorial(operand));
      } else if ('position' in item && item.type === TokenType.OPERATOR) {
        const op = OPERATORS[item.value];

        if (item.value === 'neg') {
          if (stack.length < 1) {
            throw new Error('Unary minus için yetersiz operand');
          }
          const operand = stack.pop()!;
          stack.push(operand.negated());
        } else if (op.arity === 2) {
          if (stack.length < 2) {
            throw new Error(`'${item.value}' operatörü için yetersiz operand`);
          }
          const right = stack.pop()!;
          const left = stack.pop()!;

          switch (item.value) {
            case '+':
              stack.push(left.plus(right));
              break;
            case '-':
              stack.push(left.minus(right));
              break;
            case '*':
              stack.push(left.times(right));
              break;
            case '/':
              if (right.isZero()) {
                throw new Error('Sıfıra bölme hatası');
              }
              stack.push(left.dividedBy(right));
              break;
            case '%':
              if (right.isZero()) {
                throw new Error('Sıfıra bölme hatası (mod)');
              }
              stack.push(left.mod(right));
              break;
            case '^':
              // Handle negative base with non-integer exponent
              if (left.isNegative() && !right.isInteger()) {
                throw new Error('Negatif tabanın kesirli üssü alınamaz');
              }
              stack.push(left.pow(right));
              break;
          }
        }
      } else if ('argCount' in item && item.type === 'FUNCTION') {
        const argCount = item.argCount;
        if (stack.length < argCount) {
          throw new Error(`'${item.value}' fonksiyonu için yetersiz argüman`);
        }
        const args: Decimal[] = [];
        for (let i = 0; i < argCount; i++) {
          args.unshift(stack.pop()!);
        }
        stack.push(this.evaluateFunction(item.value, args));
      }
    }

    if (stack.length !== 1) {
      throw new Error('Geçersiz ifade');
    }

    return stack[0];
  }

  /**
   * Format the result according to settings
   */
  formatResult(value: Decimal): string {
    // Check for special values
    if (!value.isFinite()) {
      if (value.isNaN()) return 'Tanımsız';
      return value.isPositive() ? '∞' : '-∞';
    }

    // Round to precision
    const rounded = value.toSignificantDigits(this.precision);

    // Check if scientific notation is needed or requested
    const absValue = rounded.abs();
    const useScientific = this.scientificNotation ||
      (absValue.greaterThan(0) && (absValue.greaterThanOrEqualTo(1e12) || absValue.lessThan(1e-6)));

    if (useScientific && !rounded.isZero()) {
      return rounded.toExponential(this.precision - 1);
    }

    // For regular display, show up to precision significant digits
    // but remove trailing zeros after decimal point
    let str = rounded.toFixed(this.precision);

    // Remove trailing zeros after decimal point
    if (str.includes('.')) {
      str = str.replace(/\.?0+$/, '');
    }

    return str;
  }

  /**
   * Main evaluate method
   */
  evaluate(expression: string): EvaluationResult {
    try {
      if (!expression.trim()) {
        return { success: false, error: 'Boş ifade' };
      }

      const tokens = this.tokenize(expression);
      const tokensWithImplicitMult = this.insertImplicitMultiplication(tokens);
      const rpn = this.toRPN(tokensWithImplicitMult);
      const result = this.evaluateRPN(rpn);

      return {
        success: true,
        value: result,
        formattedValue: this.formatResult(result),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Bilinmeyen hata',
      };
    }
  }

  /**
   * Evaluate expression with a variable (for graphing)
   */
  evaluateWithVariable(expression: string, variableName: string, variableValue: number): EvaluationResult {
    // Replace variable with value
    const substituted = expression.replace(
      new RegExp(`\\b${variableName}\\b`, 'g'),
      `(${variableValue})`
    );
    return this.evaluate(substituted);
  }

  /**
   * Evaluate expression with two variables (for 3D graphing)
   */
  evaluateWithTwoVariables(
    expression: string,
    var1Name: string, var1Value: number,
    var2Name: string, var2Value: number
  ): EvaluationResult {
    let substituted = expression.replace(
      new RegExp(`\\b${var1Name}\\b`, 'g'),
      `(${var1Value})`
    );
    substituted = substituted.replace(
      new RegExp(`\\b${var2Name}\\b`, 'g'),
      `(${var2Value})`
    );
    return this.evaluate(substituted);
  }
}
