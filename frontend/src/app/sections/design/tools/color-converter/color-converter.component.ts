import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../../components/shared';
import { Card } from 'primeng/card';
import { InputText } from 'primeng/inputtext';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { Tooltip } from 'primeng/tooltip';

interface RGB { r: number; g: number; b: number; }
interface HSL { h: number; s: number; l: number; }
interface HSV { h: number; s: number; v: number; }
interface CMYK { c: number; m: number; y: number; k: number; }

type HarmonyType = 'complementary' | 'analogous' | 'triadic' | 'split-complementary' | 'tetradic' | 'monochromatic';

@Component({
  selector: 'app-color-converter',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent,
    Card,
    InputText,
    Button,
    Select,
    Tooltip
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './color-converter.component.html',
  styleUrls: ['./color-converter.component.scss'],
})
export class ColorConverterComponent {
  // Main color state
  hexColor = signal('#1F7A8C');

  // Contrast checker colors
  foregroundColor = signal('#1C1B22');
  backgroundColor = signal('#FFFFFF');

  // Harmony type
  harmonyTypes = [
    { label: 'Tamamlayıcı', value: 'complementary' },
    { label: 'Benzer', value: 'analogous' },
    { label: 'Üçlü', value: 'triadic' },
    { label: 'Bölünmüş Tamamlayıcı', value: 'split-complementary' },
    { label: 'Dörtlü', value: 'tetradic' },
    { label: 'Tek Ton', value: 'monochromatic' }
  ];
  selectedHarmony = signal<HarmonyType>('complementary');

  // Computed color values
  rgb = computed(() => this.hexToRgb(this.hexColor()));
  hsl = computed(() => this.rgbToHsl(this.rgb()));
  hsv = computed(() => this.rgbToHsv(this.rgb()));
  cmyk = computed(() => this.rgbToCmyk(this.rgb()));

  // Formatted outputs
  hexOutput = computed(() => this.hexColor().toUpperCase());
  rgbOutput = computed(() => {
    const { r, g, b } = this.rgb();
    return `rgb(${r}, ${g}, ${b})`;
  });
  hslOutput = computed(() => {
    const { h, s, l } = this.hsl();
    return `hsl(${Math.round(h)}°, ${Math.round(s)}%, ${Math.round(l)}%)`;
  });
  hsvOutput = computed(() => {
    const { h, s, v } = this.hsv();
    return `hsv(${Math.round(h)}°, ${Math.round(s)}%, ${Math.round(v)}%)`;
  });
  cmykOutput = computed(() => {
    const { c, m, y, k } = this.cmyk();
    return `cmyk(${Math.round(c)}%, ${Math.round(m)}%, ${Math.round(y)}%, ${Math.round(k)}%)`;
  });

  // Palette colors
  palette = computed(() => this.generatePalette(this.hexColor(), this.selectedHarmony()));

  // Contrast ratio
  contrastRatio = computed(() => this.calculateContrast(this.foregroundColor(), this.backgroundColor()));
  wcagAA = computed(() => this.contrastRatio() >= 4.5);
  wcagAAA = computed(() => this.contrastRatio() >= 7);
  wcagAALarge = computed(() => this.contrastRatio() >= 3);

  // Color picker change
  onColorChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.hexColor.set(input.value);
  }

  onHexInput(value: string): void {
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      this.hexColor.set(value);
    }
  }

  // Copy to clipboard
  async copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Kopyalama başarısız:', err);
    }
  }

  // Random color
  randomColor(): void {
    const hex = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    this.hexColor.set(hex);
  }

  // Color conversion functions
  private hexToRgb(hex: string): RGB {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  private rgbToHex(rgb: RGB): string {
    return '#' + [rgb.r, rgb.g, rgb.b]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('');
  }

  private rgbToHsl(rgb: RGB): HSL {
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  private hslToRgb(hsl: HSL): RGB {
    const h = hsl.h / 360;
    const s = hsl.s / 100;
    const l = hsl.l / 100;

    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }

  private rgbToHsv(rgb: RGB): HSV {
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;

    let h = 0;
    const s = max === 0 ? 0 : d / max;
    const v = max;

    if (max !== min) {
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return { h: h * 360, s: s * 100, v: v * 100 };
  }

  private rgbToCmyk(rgb: RGB): CMYK {
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    const k = 1 - Math.max(r, g, b);

    if (k === 1) {
      return { c: 0, m: 0, y: 0, k: 100 };
    }

    const c = (1 - r - k) / (1 - k);
    const m = (1 - g - k) / (1 - k);
    const y = (1 - b - k) / (1 - k);

    return { c: c * 100, m: m * 100, y: y * 100, k: k * 100 };
  }

  // Palette generation
  private generatePalette(hex: string, harmony: HarmonyType): string[] {
    const hsl = this.rgbToHsl(this.hexToRgb(hex));
    const colors: HSL[] = [];

    switch (harmony) {
      case 'complementary':
        colors.push(hsl);
        colors.push({ ...hsl, h: (hsl.h + 180) % 360 });
        break;

      case 'analogous':
        colors.push({ ...hsl, h: (hsl.h - 30 + 360) % 360 });
        colors.push(hsl);
        colors.push({ ...hsl, h: (hsl.h + 30) % 360 });
        break;

      case 'triadic':
        colors.push(hsl);
        colors.push({ ...hsl, h: (hsl.h + 120) % 360 });
        colors.push({ ...hsl, h: (hsl.h + 240) % 360 });
        break;

      case 'split-complementary':
        colors.push(hsl);
        colors.push({ ...hsl, h: (hsl.h + 150) % 360 });
        colors.push({ ...hsl, h: (hsl.h + 210) % 360 });
        break;

      case 'tetradic':
        colors.push(hsl);
        colors.push({ ...hsl, h: (hsl.h + 90) % 360 });
        colors.push({ ...hsl, h: (hsl.h + 180) % 360 });
        colors.push({ ...hsl, h: (hsl.h + 270) % 360 });
        break;

      case 'monochromatic':
        colors.push({ ...hsl, l: Math.max(hsl.l - 30, 10) });
        colors.push({ ...hsl, l: Math.max(hsl.l - 15, 20) });
        colors.push(hsl);
        colors.push({ ...hsl, l: Math.min(hsl.l + 15, 80) });
        colors.push({ ...hsl, l: Math.min(hsl.l + 30, 90) });
        break;
    }

    return colors.map(c => this.rgbToHex(this.hslToRgb(c)));
  }

  // Contrast calculation (WCAG)
  private calculateContrast(fg: string, bg: string): number {
    const fgRgb = this.hexToRgb(fg);
    const bgRgb = this.hexToRgb(bg);

    const fgLum = this.relativeLuminance(fgRgb);
    const bgLum = this.relativeLuminance(bgRgb);

    const lighter = Math.max(fgLum, bgLum);
    const darker = Math.min(fgLum, bgLum);

    return (lighter + 0.05) / (darker + 0.05);
  }

  private relativeLuminance(rgb: RGB): number {
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
      const sRGB = c / 255;
      return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  // Export palette
  exportPalette(format: 'css' | 'scss' | 'json'): void {
    const colors = this.palette();
    let output = '';

    switch (format) {
      case 'css':
        output = ':root {\n' + colors.map((c, i) => `  --color-${i + 1}: ${c};`).join('\n') + '\n}';
        break;
      case 'scss':
        output = colors.map((c, i) => `$color-${i + 1}: ${c};`).join('\n');
        break;
      case 'json':
        output = JSON.stringify({ colors }, null, 2);
        break;
    }

    this.copyToClipboard(output);
  }
}
