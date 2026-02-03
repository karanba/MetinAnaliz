import {
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { SelectButton } from 'primeng/selectbutton';
import { Dialog } from 'primeng/dialog';
import { Tooltip } from 'primeng/tooltip';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { Message } from 'primeng/message';
import { ExpressionEvaluatorService, AngleMode } from '../../../../services/expression-evaluator.service';
import { HistoryService, HistoryEntry } from '../../../../services/history.service';
import { PageHeaderComponent } from '../../../../components/shared';

interface CalcButton {
  label: string;
  value: string;
  type: 'number' | 'operator' | 'function' | 'action' | 'memory';
  span?: number;
  class?: string;
}

@Component({
  selector: 'app-calculator',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Button,
    Card,
    InputText,
    Select,
    SelectButton,
    Dialog,
    Tooltip,
    ToggleSwitch,
    Message,
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calculator.component.html',
  styleUrls: ['./calculator.component.scss'],
})
export class CalculatorComponent {
  @ViewChild('expressionInput') expressionInput!: ElementRef<HTMLInputElement>;

  private readonly evaluator = inject(ExpressionEvaluatorService);
  readonly history = inject(HistoryService);

  // Calculator state
  expression = '';
  result = signal<string | null>(null);
  error = signal<string | null>(null);
  memory = signal<string>('0');
  historyIndex = -1;

  // Settings
  angleMode: AngleMode = 'RAD';
  angleModeOptions = [
    { label: 'RAD', value: 'RAD' },
    { label: 'DEG', value: 'DEG' },
  ];

  precision = 12;
  precisionOptions = [
    { label: '6 basamak', value: 6 },
    { label: '8 basamak', value: 8 },
    { label: '10 basamak', value: 10 },
    { label: '12 basamak', value: 12 },
    { label: '15 basamak', value: 15 },
    { label: '20 basamak', value: 20 },
  ];

  scientificNotation = false;

  // Dialogs
  shortcutsDialogVisible = false;

  // Examples dropdown
  examples = [
    { label: 'sin(pi/6)', value: 'sin(pi/6)' },
    { label: '(1+2)^3/7', value: '(1+2)^3/7' },
    { label: 'sqrt(2)^2', value: 'sqrt(2)^2' },
    { label: '0.1+0.2', value: '0.1+0.2' },
    { label: 'log10(1000)', value: 'log10(1000)' },
    { label: '5!', value: '5!' },
    { label: '2^10', value: '2^10' },
    { label: 'e^(pi*sqrt(163))', value: 'exp(pi*sqrt(163))' },
    { label: 'nCr(10,3)', value: 'nCr(10,3)' },
    { label: 'nPr(5,2)', value: 'nPr(5,2)' },
  ];
  selectedExample: string | null = null;

  // Calculator buttons layout
  scientificButtons: CalcButton[] = [
    { label: 'sin', value: 'sin(', type: 'function' },
    { label: 'cos', value: 'cos(', type: 'function' },
    { label: 'tan', value: 'tan(', type: 'function' },
    { label: 'ln', value: 'ln(', type: 'function' },
    { label: 'log', value: 'log10(', type: 'function' },
    { label: 'asin', value: 'asin(', type: 'function' },
    { label: 'acos', value: 'acos(', type: 'function' },
    { label: 'atan', value: 'atan(', type: 'function' },
    { label: 'exp', value: 'exp(', type: 'function' },
    { label: '√', value: 'sqrt(', type: 'function' },
    { label: 'sinh', value: 'sinh(', type: 'function' },
    { label: 'cosh', value: 'cosh(', type: 'function' },
    { label: 'tanh', value: 'tanh(', type: 'function' },
    { label: 'x²', value: '^2', type: 'operator' },
    { label: 'xʸ', value: '^', type: 'operator' },
    { label: '|x|', value: 'abs(', type: 'function' },
    { label: '⌊x⌋', value: 'floor(', type: 'function' },
    { label: '⌈x⌉', value: 'ceil(', type: 'function' },
    { label: 'n!', value: '!', type: 'operator' },
    { label: '%', value: '%', type: 'operator' },
    { label: 'π', value: 'pi', type: 'number' },
    { label: 'e', value: 'e', type: 'number' },
    { label: 'nPr', value: 'nPr(', type: 'function' },
    { label: 'nCr', value: 'nCr(', type: 'function' },
    { label: ',', value: ',', type: 'operator' },
  ];

  mainButtons: CalcButton[] = [
    { label: 'C', value: 'clear', type: 'action', class: 'action-btn' },
    { label: '⌫', value: 'backspace', type: 'action', class: 'action-btn' },
    { label: '(', value: '(', type: 'operator' },
    { label: ')', value: ')', type: 'operator' },
    { label: '÷', value: '/', type: 'operator', class: 'operator-btn' },

    { label: '7', value: '7', type: 'number' },
    { label: '8', value: '8', type: 'number' },
    { label: '9', value: '9', type: 'number' },
    { label: '×', value: '*', type: 'operator', class: 'operator-btn' },

    { label: '4', value: '4', type: 'number' },
    { label: '5', value: '5', type: 'number' },
    { label: '6', value: '6', type: 'number' },
    { label: '−', value: '-', type: 'operator', class: 'operator-btn' },

    { label: '1', value: '1', type: 'number' },
    { label: '2', value: '2', type: 'number' },
    { label: '3', value: '3', type: 'number' },
    { label: '+', value: '+', type: 'operator', class: 'operator-btn' },

    { label: '±', value: 'negate', type: 'action' },
    { label: '0', value: '0', type: 'number' },
    { label: '.', value: '.', type: 'number' },
    { label: '=', value: 'equals', type: 'action', class: 'equals-btn' },
  ];

  memoryButtons: CalcButton[] = [
    { label: 'MC', value: 'mc', type: 'memory' },
    { label: 'MR', value: 'mr', type: 'memory' },
    { label: 'M+', value: 'm+', type: 'memory' },
    { label: 'M−', value: 'm-', type: 'memory' },
  ];

  shortcuts = [
    { key: 'Enter', action: 'Hesapla' },
    { key: 'Escape', action: 'Temizle (C)' },
    { key: 'Backspace', action: 'Son karakteri sil' },
    { key: 'Ctrl+L', action: 'Giriş alanına odaklan' },
    { key: '↑ / ↓', action: 'Geçmişte gezin' },
    { key: 'Ctrl+C', action: 'Sonucu kopyala' },
    { key: 's', action: 'sin(' },
    { key: 'c', action: 'cos(' },
    { key: 't', action: 'tan(' },
    { key: 'l', action: 'ln(' },
    { key: 'q', action: 'sqrt(' },
    { key: 'p', action: 'π' },
  ];

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    // Don't handle if in graph tabs or dialogs
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' && target !== this.expressionInput?.nativeElement) {
      return;
    }

    // Ctrl+L: Focus input
    if (event.ctrlKey && event.key === 'l') {
      event.preventDefault();
      this.focusInput();
      return;
    }

    // Ctrl+C: Copy result
    if (event.ctrlKey && event.key === 'c' && this.result()) {
      event.preventDefault();
      this.copyResult();
      return;
    }

    // Enter: Evaluate
    if (event.key === 'Enter') {
      event.preventDefault();
      this.evaluate();
      return;
    }

    // Escape: Clear
    if (event.key === 'Escape') {
      event.preventDefault();
      this.clear();
      return;
    }

    // Arrow Up: Previous history
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.navigateHistory(-1);
      return;
    }

    // Arrow Down: Next history
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.navigateHistory(1);
      return;
    }

    // Function shortcuts (only when not typing in input)
    if (!event.ctrlKey && !event.metaKey && !event.altKey) {
      const shortcuts: Record<string, string> = {
        's': 'sin(',
        'c': 'cos(',
        't': 'tan(',
        'l': 'ln(',
        'q': 'sqrt(',
        'p': 'pi',
      };

      if (shortcuts[event.key] && document.activeElement !== this.expressionInput?.nativeElement) {
        event.preventDefault();
        this.appendToExpression(shortcuts[event.key]);
        return;
      }
    }
  }

  onAngleModeChange(): void {
    this.evaluator.setAngleMode(this.angleMode);
    // Re-evaluate if there's a result
    if (this.expression && this.result()) {
      this.evaluate();
    }
  }

  onPrecisionChange(): void {
    this.evaluator.setPrecision(this.precision);
    // Re-format result if exists
    if (this.expression && this.result()) {
      this.evaluate();
    }
  }

  onScientificNotationChange(): void {
    this.evaluator.setScientificNotation(this.scientificNotation);
    // Re-format result if exists
    if (this.expression && this.result()) {
      this.evaluate();
    }
  }

  onExampleSelect(): void {
    if (this.selectedExample) {
      this.expression = this.selectedExample;
      this.evaluate();
      this.selectedExample = null;
    }
  }

  handleButtonClick(button: CalcButton): void {
    switch (button.type) {
      case 'number':
      case 'operator':
      case 'function':
        this.appendToExpression(button.value);
        break;
      case 'action':
        this.handleAction(button.value);
        break;
      case 'memory':
        this.handleMemory(button.value);
        break;
    }
  }

  private appendToExpression(value: string): void {
    this.expression += value;
    this.error.set(null);
    this.focusInput();
  }

  private handleAction(action: string): void {
    switch (action) {
      case 'clear':
        this.clear();
        break;
      case 'backspace':
        this.backspace();
        break;
      case 'equals':
        this.evaluate();
        break;
      case 'negate':
        this.negateExpression();
        break;
    }
  }

  private handleMemory(action: string): void {
    const currentResult = this.result();
    switch (action) {
      case 'mc':
        this.memory.set('0');
        break;
      case 'mr':
        this.appendToExpression(this.memory());
        break;
      case 'm+':
        if (currentResult) {
          const evalResult = this.evaluator.evaluate(`${this.memory()}+${currentResult}`);
          if (evalResult.success && evalResult.formattedValue) {
            this.memory.set(evalResult.formattedValue);
          }
        }
        break;
      case 'm-':
        if (currentResult) {
          const evalResult = this.evaluator.evaluate(`${this.memory()}-${currentResult}`);
          if (evalResult.success && evalResult.formattedValue) {
            this.memory.set(evalResult.formattedValue);
          }
        }
        break;
    }
  }

  clear(): void {
    this.expression = '';
    this.result.set(null);
    this.error.set(null);
    this.historyIndex = -1;
    this.focusInput();
  }

  backspace(): void {
    if (this.expression.length > 0) {
      // Try to remove entire function names
      const functionPattern = /(sin|cos|tan|asin|acos|atan|sinh|cosh|tanh|ln|log10|exp|sqrt|abs|floor|ceil|round|nPr|nCr)\($/;
      const match = this.expression.match(functionPattern);
      if (match) {
        this.expression = this.expression.slice(0, -match[0].length);
      } else {
        this.expression = this.expression.slice(0, -1);
      }
    }
    this.error.set(null);
    this.focusInput();
  }

  evaluate(): void {
    if (!this.expression.trim()) {
      return;
    }

    const evalResult = this.evaluator.evaluate(this.expression);

    if (evalResult.success && evalResult.formattedValue) {
      this.result.set(evalResult.formattedValue);
      this.error.set(null);
      this.history.addEntry(this.expression, evalResult.formattedValue);
      this.historyIndex = -1;
    } else {
      this.result.set(null);
      this.error.set(evalResult.error || 'Bilinmeyen hata');
    }
  }

  private negateExpression(): void {
    if (this.expression) {
      if (this.expression.startsWith('-(') && this.expression.endsWith(')')) {
        this.expression = this.expression.slice(2, -1);
      } else if (this.expression.startsWith('-')) {
        this.expression = this.expression.slice(1);
      } else {
        this.expression = `-(${this.expression})`;
      }
    }
  }

  navigateHistory(direction: number): void {
    const entries = this.history.entries();
    if (entries.length === 0) return;

    const newIndex = this.historyIndex + direction;

    if (newIndex < -1) return;
    if (newIndex >= entries.length) return;

    this.historyIndex = newIndex;

    if (this.historyIndex === -1) {
      this.expression = '';
    } else {
      this.expression = entries[this.historyIndex].expression;
    }
  }

  useHistoryEntry(entry: HistoryEntry): void {
    this.expression = entry.expression;
    this.result.set(entry.result);
    this.error.set(null);
    this.focusInput();
  }

  copyResult(): void {
    const currentResult = this.result();
    if (currentResult) {
      navigator.clipboard.writeText(currentResult).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = currentResult;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      });
    }
  }

  focusInput(): void {
    setTimeout(() => {
      this.expressionInput?.nativeElement?.focus();
    }, 0);
  }

  showShortcutsDialog(): void {
    this.shortcutsDialogVisible = true;
  }

  clearHistory(): void {
    this.history.clearHistory();
  }

  trackByHistoryId(index: number, entry: HistoryEntry): number {
    return entry.id;
  }
}
