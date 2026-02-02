import { TestBed } from '@angular/core/testing';
import { ExpressionEvaluatorService } from './expression-evaluator.service';

describe('ExpressionEvaluatorService', () => {
  let service: ExpressionEvaluatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExpressionEvaluatorService);
    service.setAngleMode('RAD');
    service.setPrecision(12);
    service.setScientificNotation(false);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Basic Arithmetic', () => {
    it('should evaluate simple addition', () => {
      const result = service.evaluate('2+3');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBe(5);
    });

    it('should evaluate simple subtraction', () => {
      const result = service.evaluate('10-4');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBe(6);
    });

    it('should evaluate simple multiplication', () => {
      const result = service.evaluate('3*4');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBe(12);
    });

    it('should evaluate simple division', () => {
      const result = service.evaluate('15/3');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBe(5);
    });

    it('should evaluate modulo', () => {
      const result = service.evaluate('17%5');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBe(2);
    });
  });

  describe('Operator Precedence', () => {
    it('should respect multiplication over addition: 2+3*4 = 14', () => {
      const result = service.evaluate('2+3*4');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBe(14);
    });

    it('should respect division over subtraction', () => {
      const result = service.evaluate('10-6/2');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBe(7);
    });

    it('should handle complex precedence: 2+3*4-10/2', () => {
      const result = service.evaluate('2+3*4-10/2');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBe(9); // 2 + 12 - 5 = 9
    });
  });

  describe('Parentheses', () => {
    it('should handle parentheses: (2+3)*4 = 20', () => {
      const result = service.evaluate('(2+3)*4');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBe(20);
    });

    it('should handle nested parentheses', () => {
      const result = service.evaluate('((2+3)*4)+1');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBe(21);
    });

    it('should handle deeply nested parentheses', () => {
      const result = service.evaluate('(((1+2)+3)+4)');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBe(10);
    });
  });

  describe('Exponentiation (Right Associative)', () => {
    it('should evaluate simple exponentiation: 2^3 = 8', () => {
      const result = service.evaluate('2^3');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBe(8);
    });

    it('should be right associative: 2^3^2 = 512 (not 64)', () => {
      const result = service.evaluate('2^3^2');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBe(512); // 2^(3^2) = 2^9 = 512
    });

    it('should handle exponentiation with precedence: 2*3^2 = 18', () => {
      const result = service.evaluate('2*3^2');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBe(18);
    });
  });

  describe('Unary Minus', () => {
    it('should handle unary minus at start', () => {
      const result = service.evaluate('-5');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBe(-5);
    });

    it('should handle unary minus after operator', () => {
      const result = service.evaluate('3*-2');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBe(-6);
    });

    it('should handle unary minus after parenthesis', () => {
      const result = service.evaluate('(-3)+5');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBe(2);
    });
  });

  describe('Factorial', () => {
    it('should calculate factorial: 5! = 120', () => {
      const result = service.evaluate('5!');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBe(120);
    });

    it('should calculate factorial of 0: 0! = 1', () => {
      const result = service.evaluate('0!');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBe(1);
    });

    it('should handle factorial in expression: 3!+2 = 8', () => {
      const result = service.evaluate('3!+2');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBe(8);
    });

    it('should reject negative factorial', () => {
      const result = service.evaluate('(-3)!');
      expect(result.success).toBe(false);
      expect(result.error).toContain('negatif');
    });
  });

  describe('Constants', () => {
    it('should evaluate pi', () => {
      const result = service.evaluate('pi');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBeCloseTo(Math.PI, 10);
    });

    it('should evaluate e', () => {
      const result = service.evaluate('e');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBeCloseTo(Math.E, 10);
    });
  });

  describe('Implicit Multiplication', () => {
    it('should handle implicit multiplication: 2pi', () => {
      const result = service.evaluate('2pi');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBeCloseTo(2 * Math.PI, 10);
    });

    it('should handle implicit multiplication: 2(3+4) = 14', () => {
      const result = service.evaluate('2(3+4)');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBe(14);
    });

    it('should handle implicit multiplication: (2+3)(4+5) = 45', () => {
      const result = service.evaluate('(2+3)(4+5)');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBe(45);
    });

    it('should handle implicit multiplication with functions: 2sin(0)', () => {
      const result = service.evaluate('2sin(0)');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBeCloseTo(0, 10);
    });
  });

  describe('Trigonometric Functions (RAD mode)', () => {
    it('should calculate sin(0) = 0', () => {
      const result = service.evaluate('sin(0)');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBeCloseTo(0, 10);
    });

    it('should calculate sin(pi/2) = 1', () => {
      const result = service.evaluate('sin(pi/2)');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBeCloseTo(1, 10);
    });

    it('should calculate cos(0) = 1', () => {
      const result = service.evaluate('cos(0)');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBeCloseTo(1, 10);
    });

    it('should calculate cos(pi) = -1', () => {
      const result = service.evaluate('cos(pi)');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBeCloseTo(-1, 10);
    });

    it('should calculate tan(0) = 0', () => {
      const result = service.evaluate('tan(0)');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBeCloseTo(0, 10);
    });
  });

  describe('Trigonometric Functions (DEG mode)', () => {
    beforeEach(() => {
      service.setAngleMode('DEG');
    });

    it('should calculate sin(30) = 0.5', () => {
      const result = service.evaluate('sin(30)');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBeCloseTo(0.5, 6);
    });

    it('should calculate sin(90) = 1', () => {
      const result = service.evaluate('sin(90)');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBeCloseTo(1, 6);
    });

    it('should calculate cos(60) = 0.5', () => {
      const result = service.evaluate('cos(60)');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBeCloseTo(0.5, 6);
    });

    it('should calculate tan(45) = 1', () => {
      const result = service.evaluate('tan(45)');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBeCloseTo(1, 6);
    });
  });

  describe('Inverse Trigonometric Functions', () => {
    it('should calculate asin(0.5) in RAD', () => {
      service.setAngleMode('RAD');
      const result = service.evaluate('asin(0.5)');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBeCloseTo(Math.PI / 6, 10);
    });

    it('should calculate asin(0.5) in DEG = 30', () => {
      service.setAngleMode('DEG');
      const result = service.evaluate('asin(0.5)');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBeCloseTo(30, 6);
    });

    it('should reject asin(2) (out of domain)', () => {
      const result = service.evaluate('asin(2)');
      expect(result.success).toBe(false);
      expect(result.error).toContain('-1');
    });
  });

  describe('Logarithmic Functions', () => {
    it('should calculate ln(e) = 1', () => {
      const result = service.evaluate('ln(e)');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBeCloseTo(1, 10);
    });

    it('should calculate ln(1) = 0', () => {
      const result = service.evaluate('ln(1)');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBeCloseTo(0, 10);
    });

    it('should calculate log10(1000) = 3', () => {
      const result = service.evaluate('log10(1000)');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBeCloseTo(3, 10);
    });

    it('should reject ln(0)', () => {
      const result = service.evaluate('ln(0)');
      expect(result.success).toBe(false);
      expect(result.error).toContain('pozitif');
    });

    it('should reject ln(-1)', () => {
      const result = service.evaluate('ln(-1)');
      expect(result.success).toBe(false);
    });
  });

  describe('Other Functions', () => {
    it('should calculate sqrt(4) = 2', () => {
      const result = service.evaluate('sqrt(4)');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBe(2);
    });

    it('should calculate sqrt(2)^2 = 2', () => {
      const result = service.evaluate('sqrt(2)^2');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBeCloseTo(2, 10);
    });

    it('should reject sqrt(-1)', () => {
      const result = service.evaluate('sqrt(-1)');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Negatif');
    });

    it('should calculate abs(-5) = 5', () => {
      const result = service.evaluate('abs(-5)');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBe(5);
    });

    it('should calculate floor(3.7) = 3', () => {
      const result = service.evaluate('floor(3.7)');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBe(3);
    });

    it('should calculate ceil(3.2) = 4', () => {
      const result = service.evaluate('ceil(3.2)');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBe(4);
    });

    it('should calculate round(3.5) = 4', () => {
      const result = service.evaluate('round(3.5)');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBe(4);
    });

    it('should calculate exp(1) = e', () => {
      const result = service.evaluate('exp(1)');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBeCloseTo(Math.E, 10);
    });
  });

  describe('Hyperbolic Functions', () => {
    it('should calculate sinh(0) = 0', () => {
      const result = service.evaluate('sinh(0)');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBeCloseTo(0, 10);
    });

    it('should calculate cosh(0) = 1', () => {
      const result = service.evaluate('cosh(0)');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBeCloseTo(1, 10);
    });

    it('should calculate tanh(0) = 0', () => {
      const result = service.evaluate('tanh(0)');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBeCloseTo(0, 10);
    });
  });

  describe('Permutations and Combinations', () => {
    it('should calculate nPr(5,2) = 20', () => {
      const result = service.evaluate('nPr(5,2)');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBe(20);
    });

    it('should calculate nCr(5,2) = 10', () => {
      const result = service.evaluate('nCr(5,2)');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBe(10);
    });

    it('should calculate nCr(10,3) = 120', () => {
      const result = service.evaluate('nCr(10,3)');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBe(120);
    });

    it('should return 0 for nCr when r > n', () => {
      const result = service.evaluate('nCr(3,5)');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBe(0);
    });
  });

  describe('Floating Point Precision', () => {
    it('should handle 0.1 + 0.2 correctly', () => {
      const result = service.evaluate('0.1+0.2');
      expect(result.success).toBe(true);
      // With Decimal.js, this should be exactly 0.3
      expect(result.formattedValue).toBe('0.3');
    });

    it('should handle 0.3 - 0.1 correctly', () => {
      const result = service.evaluate('0.3-0.1');
      expect(result.success).toBe(true);
      expect(result.formattedValue).toBe('0.2');
    });

    it('should handle 1.1 + 2.2 correctly', () => {
      const result = service.evaluate('1.1+2.2');
      expect(result.success).toBe(true);
      expect(result.formattedValue).toBe('3.3');
    });
  });

  describe('Error Handling', () => {
    it('should handle division by zero', () => {
      const result = service.evaluate('5/0');
      expect(result.success).toBe(false);
      expect(result.error).toContain('bölme');
    });

    it('should handle unmatched parentheses', () => {
      const result = service.evaluate('(2+3');
      expect(result.success).toBe(false);
      expect(result.error).toContain('parantez');
    });

    it('should handle unknown identifier', () => {
      const result = service.evaluate('xyz+2');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Bilinmeyen');
    });

    it('should handle empty expression', () => {
      const result = service.evaluate('');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Boş');
    });

    it('should handle whitespace-only expression', () => {
      const result = service.evaluate('   ');
      expect(result.success).toBe(false);
    });
  });

  describe('Complex Expressions', () => {
    it('should evaluate (1+2)^3/7', () => {
      const result = service.evaluate('(1+2)^3/7');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBeCloseTo(27 / 7, 10);
    });

    it('should evaluate sin(pi/6)', () => {
      const result = service.evaluate('sin(pi/6)');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBeCloseTo(0.5, 6);
    });

    it('should evaluate complex nested expression', () => {
      const result = service.evaluate('sqrt(sin(pi/2)^2+cos(pi/2)^2)');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBeCloseTo(1, 10);
    });

    it('should evaluate 2^10', () => {
      const result = service.evaluate('2^10');
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBe(1024);
    });
  });

  describe('Variable Substitution (for graphing)', () => {
    it('should evaluate expression with x variable', () => {
      const result = service.evaluateWithVariable('x^2', 'x', 3);
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBe(9);
    });

    it('should evaluate expression with x and y variables', () => {
      const result = service.evaluateWithTwoVariables('x+y', 'x', 2, 'y', 3);
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBe(5);
    });

    it('should evaluate sin(x) with variable', () => {
      const result = service.evaluateWithVariable('sin(x)', 'x', Math.PI / 2);
      expect(result.success).toBe(true);
      expect(result.value?.toNumber()).toBeCloseTo(1, 10);
    });
  });
});
