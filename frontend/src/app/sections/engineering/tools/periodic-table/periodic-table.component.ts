import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../../components/shared';

type ElementCategory =
  | 'alkali-metal'
  | 'alkaline-earth'
  | 'transition-metal'
  | 'post-transition'
  | 'metalloid'
  | 'nonmetal'
  | 'halogen'
  | 'noble-gas'
  | 'lanthanide'
  | 'actinide'
  | 'unknown';

type ElementBlock = 's' | 'p' | 'd' | 'f';

type ElementSeries = 'lanthanide' | 'actinide';

interface PeriodicElement {
  atomicNumber: number;
  symbol: string;
  name: string;
  period: number;
  group: number;
  category: ElementCategory;
  block: ElementBlock;
  series?: ElementSeries;
  seriesIndex?: number;
}

const ELEMENTS: PeriodicElement[] = [
  { atomicNumber: 1, symbol: 'H', name: 'Hydrogen', period: 1, group: 1, category: 'nonmetal', block: 's' },
  { atomicNumber: 2, symbol: 'He', name: 'Helium', period: 1, group: 18, category: 'noble-gas', block: 's' },
  { atomicNumber: 3, symbol: 'Li', name: 'Lithium', period: 2, group: 1, category: 'alkali-metal', block: 's' },
  { atomicNumber: 4, symbol: 'Be', name: 'Beryllium', period: 2, group: 2, category: 'alkaline-earth', block: 's' },
  { atomicNumber: 5, symbol: 'B', name: 'Boron', period: 2, group: 13, category: 'metalloid', block: 'p' },
  { atomicNumber: 6, symbol: 'C', name: 'Carbon', period: 2, group: 14, category: 'nonmetal', block: 'p' },
  { atomicNumber: 7, symbol: 'N', name: 'Nitrogen', period: 2, group: 15, category: 'nonmetal', block: 'p' },
  { atomicNumber: 8, symbol: 'O', name: 'Oxygen', period: 2, group: 16, category: 'nonmetal', block: 'p' },
  { atomicNumber: 9, symbol: 'F', name: 'Fluorine', period: 2, group: 17, category: 'halogen', block: 'p' },
  { atomicNumber: 10, symbol: 'Ne', name: 'Neon', period: 2, group: 18, category: 'noble-gas', block: 'p' },
  { atomicNumber: 11, symbol: 'Na', name: 'Sodium', period: 3, group: 1, category: 'alkali-metal', block: 's' },
  { atomicNumber: 12, symbol: 'Mg', name: 'Magnesium', period: 3, group: 2, category: 'alkaline-earth', block: 's' },
  { atomicNumber: 13, symbol: 'Al', name: 'Aluminium', period: 3, group: 13, category: 'post-transition', block: 'p' },
  { atomicNumber: 14, symbol: 'Si', name: 'Silicon', period: 3, group: 14, category: 'metalloid', block: 'p' },
  { atomicNumber: 15, symbol: 'P', name: 'Phosphorus', period: 3, group: 15, category: 'nonmetal', block: 'p' },
  { atomicNumber: 16, symbol: 'S', name: 'Sulfur', period: 3, group: 16, category: 'nonmetal', block: 'p' },
  { atomicNumber: 17, symbol: 'Cl', name: 'Chlorine', period: 3, group: 17, category: 'halogen', block: 'p' },
  { atomicNumber: 18, symbol: 'Ar', name: 'Argon', period: 3, group: 18, category: 'noble-gas', block: 'p' },
  { atomicNumber: 19, symbol: 'K', name: 'Potassium', period: 4, group: 1, category: 'alkali-metal', block: 's' },
  { atomicNumber: 20, symbol: 'Ca', name: 'Calcium', period: 4, group: 2, category: 'alkaline-earth', block: 's' },
  { atomicNumber: 21, symbol: 'Sc', name: 'Scandium', period: 4, group: 3, category: 'transition-metal', block: 'd' },
  { atomicNumber: 22, symbol: 'Ti', name: 'Titanium', period: 4, group: 4, category: 'transition-metal', block: 'd' },
  { atomicNumber: 23, symbol: 'V', name: 'Vanadium', period: 4, group: 5, category: 'transition-metal', block: 'd' },
  { atomicNumber: 24, symbol: 'Cr', name: 'Chromium', period: 4, group: 6, category: 'transition-metal', block: 'd' },
  { atomicNumber: 25, symbol: 'Mn', name: 'Manganese', period: 4, group: 7, category: 'transition-metal', block: 'd' },
  { atomicNumber: 26, symbol: 'Fe', name: 'Iron', period: 4, group: 8, category: 'transition-metal', block: 'd' },
  { atomicNumber: 27, symbol: 'Co', name: 'Cobalt', period: 4, group: 9, category: 'transition-metal', block: 'd' },
  { atomicNumber: 28, symbol: 'Ni', name: 'Nickel', period: 4, group: 10, category: 'transition-metal', block: 'd' },
  { atomicNumber: 29, symbol: 'Cu', name: 'Copper', period: 4, group: 11, category: 'transition-metal', block: 'd' },
  { atomicNumber: 30, symbol: 'Zn', name: 'Zinc', period: 4, group: 12, category: 'transition-metal', block: 'd' },
  { atomicNumber: 31, symbol: 'Ga', name: 'Gallium', period: 4, group: 13, category: 'post-transition', block: 'p' },
  { atomicNumber: 32, symbol: 'Ge', name: 'Germanium', period: 4, group: 14, category: 'metalloid', block: 'p' },
  { atomicNumber: 33, symbol: 'As', name: 'Arsenic', period: 4, group: 15, category: 'metalloid', block: 'p' },
  { atomicNumber: 34, symbol: 'Se', name: 'Selenium', period: 4, group: 16, category: 'nonmetal', block: 'p' },
  { atomicNumber: 35, symbol: 'Br', name: 'Bromine', period: 4, group: 17, category: 'halogen', block: 'p' },
  { atomicNumber: 36, symbol: 'Kr', name: 'Krypton', period: 4, group: 18, category: 'noble-gas', block: 'p' },
  { atomicNumber: 37, symbol: 'Rb', name: 'Rubidium', period: 5, group: 1, category: 'alkali-metal', block: 's' },
  { atomicNumber: 38, symbol: 'Sr', name: 'Strontium', period: 5, group: 2, category: 'alkaline-earth', block: 's' },
  { atomicNumber: 39, symbol: 'Y', name: 'Yttrium', period: 5, group: 3, category: 'transition-metal', block: 'd' },
  { atomicNumber: 40, symbol: 'Zr', name: 'Zirconium', period: 5, group: 4, category: 'transition-metal', block: 'd' },
  { atomicNumber: 41, symbol: 'Nb', name: 'Niobium', period: 5, group: 5, category: 'transition-metal', block: 'd' },
  { atomicNumber: 42, symbol: 'Mo', name: 'Molybdenum', period: 5, group: 6, category: 'transition-metal', block: 'd' },
  { atomicNumber: 43, symbol: 'Tc', name: 'Technetium', period: 5, group: 7, category: 'transition-metal', block: 'd' },
  { atomicNumber: 44, symbol: 'Ru', name: 'Ruthenium', period: 5, group: 8, category: 'transition-metal', block: 'd' },
  { atomicNumber: 45, symbol: 'Rh', name: 'Rhodium', period: 5, group: 9, category: 'transition-metal', block: 'd' },
  { atomicNumber: 46, symbol: 'Pd', name: 'Palladium', period: 5, group: 10, category: 'transition-metal', block: 'd' },
  { atomicNumber: 47, symbol: 'Ag', name: 'Silver', period: 5, group: 11, category: 'transition-metal', block: 'd' },
  { atomicNumber: 48, symbol: 'Cd', name: 'Cadmium', period: 5, group: 12, category: 'transition-metal', block: 'd' },
  { atomicNumber: 49, symbol: 'In', name: 'Indium', period: 5, group: 13, category: 'post-transition', block: 'p' },
  { atomicNumber: 50, symbol: 'Sn', name: 'Tin', period: 5, group: 14, category: 'post-transition', block: 'p' },
  { atomicNumber: 51, symbol: 'Sb', name: 'Antimony', period: 5, group: 15, category: 'metalloid', block: 'p' },
  { atomicNumber: 52, symbol: 'Te', name: 'Tellurium', period: 5, group: 16, category: 'metalloid', block: 'p' },
  { atomicNumber: 53, symbol: 'I', name: 'Iodine', period: 5, group: 17, category: 'halogen', block: 'p' },
  { atomicNumber: 54, symbol: 'Xe', name: 'Xenon', period: 5, group: 18, category: 'noble-gas', block: 'p' },
  { atomicNumber: 55, symbol: 'Cs', name: 'Cesium', period: 6, group: 1, category: 'alkali-metal', block: 's' },
  { atomicNumber: 56, symbol: 'Ba', name: 'Barium', period: 6, group: 2, category: 'alkaline-earth', block: 's' },
  { atomicNumber: 57, symbol: 'La', name: 'Lanthanum', period: 6, group: 3, category: 'lanthanide', block: 'f' },
  { atomicNumber: 58, symbol: 'Ce', name: 'Cerium', period: 6, group: 3, category: 'lanthanide', block: 'f', series: 'lanthanide', seriesIndex: 0 },
  { atomicNumber: 59, symbol: 'Pr', name: 'Praseodymium', period: 6, group: 3, category: 'lanthanide', block: 'f', series: 'lanthanide', seriesIndex: 1 },
  { atomicNumber: 60, symbol: 'Nd', name: 'Neodymium', period: 6, group: 3, category: 'lanthanide', block: 'f', series: 'lanthanide', seriesIndex: 2 },
  { atomicNumber: 61, symbol: 'Pm', name: 'Promethium', period: 6, group: 3, category: 'lanthanide', block: 'f', series: 'lanthanide', seriesIndex: 3 },
  { atomicNumber: 62, symbol: 'Sm', name: 'Samarium', period: 6, group: 3, category: 'lanthanide', block: 'f', series: 'lanthanide', seriesIndex: 4 },
  { atomicNumber: 63, symbol: 'Eu', name: 'Europium', period: 6, group: 3, category: 'lanthanide', block: 'f', series: 'lanthanide', seriesIndex: 5 },
  { atomicNumber: 64, symbol: 'Gd', name: 'Gadolinium', period: 6, group: 3, category: 'lanthanide', block: 'f', series: 'lanthanide', seriesIndex: 6 },
  { atomicNumber: 65, symbol: 'Tb', name: 'Terbium', period: 6, group: 3, category: 'lanthanide', block: 'f', series: 'lanthanide', seriesIndex: 7 },
  { atomicNumber: 66, symbol: 'Dy', name: 'Dysprosium', period: 6, group: 3, category: 'lanthanide', block: 'f', series: 'lanthanide', seriesIndex: 8 },
  { atomicNumber: 67, symbol: 'Ho', name: 'Holmium', period: 6, group: 3, category: 'lanthanide', block: 'f', series: 'lanthanide', seriesIndex: 9 },
  { atomicNumber: 68, symbol: 'Er', name: 'Erbium', period: 6, group: 3, category: 'lanthanide', block: 'f', series: 'lanthanide', seriesIndex: 10 },
  { atomicNumber: 69, symbol: 'Tm', name: 'Thulium', period: 6, group: 3, category: 'lanthanide', block: 'f', series: 'lanthanide', seriesIndex: 11 },
  { atomicNumber: 70, symbol: 'Yb', name: 'Ytterbium', period: 6, group: 3, category: 'lanthanide', block: 'f', series: 'lanthanide', seriesIndex: 12 },
  { atomicNumber: 71, symbol: 'Lu', name: 'Lutetium', period: 6, group: 3, category: 'lanthanide', block: 'f', series: 'lanthanide', seriesIndex: 13 },
  { atomicNumber: 72, symbol: 'Hf', name: 'Hafnium', period: 6, group: 4, category: 'transition-metal', block: 'd' },
  { atomicNumber: 73, symbol: 'Ta', name: 'Tantalum', period: 6, group: 5, category: 'transition-metal', block: 'd' },
  { atomicNumber: 74, symbol: 'W', name: 'Tungsten', period: 6, group: 6, category: 'transition-metal', block: 'd' },
  { atomicNumber: 75, symbol: 'Re', name: 'Rhenium', period: 6, group: 7, category: 'transition-metal', block: 'd' },
  { atomicNumber: 76, symbol: 'Os', name: 'Osmium', period: 6, group: 8, category: 'transition-metal', block: 'd' },
  { atomicNumber: 77, symbol: 'Ir', name: 'Iridium', period: 6, group: 9, category: 'transition-metal', block: 'd' },
  { atomicNumber: 78, symbol: 'Pt', name: 'Platinum', period: 6, group: 10, category: 'transition-metal', block: 'd' },
  { atomicNumber: 79, symbol: 'Au', name: 'Gold', period: 6, group: 11, category: 'transition-metal', block: 'd' },
  { atomicNumber: 80, symbol: 'Hg', name: 'Mercury', period: 6, group: 12, category: 'transition-metal', block: 'd' },
  { atomicNumber: 81, symbol: 'Tl', name: 'Thallium', period: 6, group: 13, category: 'post-transition', block: 'p' },
  { atomicNumber: 82, symbol: 'Pb', name: 'Lead', period: 6, group: 14, category: 'post-transition', block: 'p' },
  { atomicNumber: 83, symbol: 'Bi', name: 'Bismuth', period: 6, group: 15, category: 'post-transition', block: 'p' },
  { atomicNumber: 84, symbol: 'Po', name: 'Polonium', period: 6, group: 16, category: 'post-transition', block: 'p' },
  { atomicNumber: 85, symbol: 'At', name: 'Astatine', period: 6, group: 17, category: 'halogen', block: 'p' },
  { atomicNumber: 86, symbol: 'Rn', name: 'Radon', period: 6, group: 18, category: 'noble-gas', block: 'p' },
  { atomicNumber: 87, symbol: 'Fr', name: 'Francium', period: 7, group: 1, category: 'alkali-metal', block: 's' },
  { atomicNumber: 88, symbol: 'Ra', name: 'Radium', period: 7, group: 2, category: 'alkaline-earth', block: 's' },
  { atomicNumber: 89, symbol: 'Ac', name: 'Actinium', period: 7, group: 3, category: 'actinide', block: 'f' },
  { atomicNumber: 90, symbol: 'Th', name: 'Thorium', period: 7, group: 3, category: 'actinide', block: 'f', series: 'actinide', seriesIndex: 0 },
  { atomicNumber: 91, symbol: 'Pa', name: 'Protactinium', period: 7, group: 3, category: 'actinide', block: 'f', series: 'actinide', seriesIndex: 1 },
  { atomicNumber: 92, symbol: 'U', name: 'Uranium', period: 7, group: 3, category: 'actinide', block: 'f', series: 'actinide', seriesIndex: 2 },
  { atomicNumber: 93, symbol: 'Np', name: 'Neptunium', period: 7, group: 3, category: 'actinide', block: 'f', series: 'actinide', seriesIndex: 3 },
  { atomicNumber: 94, symbol: 'Pu', name: 'Plutonium', period: 7, group: 3, category: 'actinide', block: 'f', series: 'actinide', seriesIndex: 4 },
  { atomicNumber: 95, symbol: 'Am', name: 'Americium', period: 7, group: 3, category: 'actinide', block: 'f', series: 'actinide', seriesIndex: 5 },
  { atomicNumber: 96, symbol: 'Cm', name: 'Curium', period: 7, group: 3, category: 'actinide', block: 'f', series: 'actinide', seriesIndex: 6 },
  { atomicNumber: 97, symbol: 'Bk', name: 'Berkelium', period: 7, group: 3, category: 'actinide', block: 'f', series: 'actinide', seriesIndex: 7 },
  { atomicNumber: 98, symbol: 'Cf', name: 'Californium', period: 7, group: 3, category: 'actinide', block: 'f', series: 'actinide', seriesIndex: 8 },
  { atomicNumber: 99, symbol: 'Es', name: 'Einsteinium', period: 7, group: 3, category: 'actinide', block: 'f', series: 'actinide', seriesIndex: 9 },
  { atomicNumber: 100, symbol: 'Fm', name: 'Fermium', period: 7, group: 3, category: 'actinide', block: 'f', series: 'actinide', seriesIndex: 10 },
  { atomicNumber: 101, symbol: 'Md', name: 'Mendelevium', period: 7, group: 3, category: 'actinide', block: 'f', series: 'actinide', seriesIndex: 11 },
  { atomicNumber: 102, symbol: 'No', name: 'Nobelium', period: 7, group: 3, category: 'actinide', block: 'f', series: 'actinide', seriesIndex: 12 },
  { atomicNumber: 103, symbol: 'Lr', name: 'Lawrencium', period: 7, group: 3, category: 'actinide', block: 'f', series: 'actinide', seriesIndex: 13 },
  { atomicNumber: 104, symbol: 'Rf', name: 'Rutherfordium', period: 7, group: 4, category: 'transition-metal', block: 'd' },
  { atomicNumber: 105, symbol: 'Db', name: 'Dubnium', period: 7, group: 5, category: 'transition-metal', block: 'd' },
  { atomicNumber: 106, symbol: 'Sg', name: 'Seaborgium', period: 7, group: 6, category: 'transition-metal', block: 'd' },
  { atomicNumber: 107, symbol: 'Bh', name: 'Bohrium', period: 7, group: 7, category: 'transition-metal', block: 'd' },
  { atomicNumber: 108, symbol: 'Hs', name: 'Hassium', period: 7, group: 8, category: 'transition-metal', block: 'd' },
  { atomicNumber: 109, symbol: 'Mt', name: 'Meitnerium', period: 7, group: 9, category: 'transition-metal', block: 'd' },
  { atomicNumber: 110, symbol: 'Ds', name: 'Darmstadtium', period: 7, group: 10, category: 'transition-metal', block: 'd' },
  { atomicNumber: 111, symbol: 'Rg', name: 'Roentgenium', period: 7, group: 11, category: 'transition-metal', block: 'd' },
  { atomicNumber: 112, symbol: 'Cn', name: 'Copernicium', period: 7, group: 12, category: 'transition-metal', block: 'd' },
  { atomicNumber: 113, symbol: 'Nh', name: 'Nihonium', period: 7, group: 13, category: 'post-transition', block: 'p' },
  { atomicNumber: 114, symbol: 'Fl', name: 'Flerovium', period: 7, group: 14, category: 'post-transition', block: 'p' },
  { atomicNumber: 115, symbol: 'Mc', name: 'Moscovium', period: 7, group: 15, category: 'post-transition', block: 'p' },
  { atomicNumber: 116, symbol: 'Lv', name: 'Livermorium', period: 7, group: 16, category: 'post-transition', block: 'p' },
  { atomicNumber: 117, symbol: 'Ts', name: 'Tennessine', period: 7, group: 17, category: 'halogen', block: 'p' },
  { atomicNumber: 118, symbol: 'Og', name: 'Oganesson', period: 7, group: 18, category: 'noble-gas', block: 'p' },
];

const CATEGORY_LABELS: Record<ElementCategory, string> = {
  'alkali-metal': 'Alkali Metal',
  'alkaline-earth': 'Toprak Alkali',
  'transition-metal': 'Geçiş Metali',
  'post-transition': 'Geçiş Sonrası',
  'metalloid': 'Yarı Metal',
  'nonmetal': 'Ametal',
  'halogen': 'Halojen',
  'noble-gas': 'Soygaz',
  'lanthanide': 'Lantanit',
  'actinide': 'Aktinit',
  'unknown': 'Bilinmeyen',
};

const CATEGORY_ORDER: ElementCategory[] = [
  'alkali-metal',
  'alkaline-earth',
  'transition-metal',
  'post-transition',
  'metalloid',
  'nonmetal',
  'halogen',
  'noble-gas',
  'lanthanide',
  'actinide',
];

@Component({
  selector: 'app-periodic-table',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  templateUrl: './periodic-table.component.html',
  styleUrls: ['./periodic-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PeriodicTableComponent {
  readonly elements = ELEMENTS;
  readonly categoryLegend = CATEGORY_ORDER.map(category => ({
    category,
    label: CATEGORY_LABELS[category],
  }));

  readonly searchQuery = signal('');
  readonly selectedElement = signal<PeriodicElement | null>(null);

  getGridRow(element: PeriodicElement): number {
    if (element.series === 'lanthanide') return 9;
    if (element.series === 'actinide') return 10;
    return element.period + 1;
  }

  getGridColumn(element: PeriodicElement): number {
    if (element.series === 'lanthanide' || element.series === 'actinide') {
      return 4 + (element.seriesIndex ?? 0);
    }
    return element.group + 1;
  }

  matchesQuery(element: PeriodicElement): boolean {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) return true;
    return (
      element.name.toLowerCase().includes(query) ||
      element.symbol.toLowerCase().includes(query) ||
      element.atomicNumber.toString() === query
    );
  }

  selectElement(element: PeriodicElement): void {
    this.selectedElement.set(element);
  }

  clearSelection(): void {
    this.selectedElement.set(null);
  }

  getCategoryLabel(category: ElementCategory): string {
    return CATEGORY_LABELS[category] ?? category;
  }
}
