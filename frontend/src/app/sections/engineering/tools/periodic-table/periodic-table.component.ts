import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../../components/shared';
import { ELEMENT_DETAILS, ElementDetails } from './periodic-table.data';

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

interface PeriodicElement extends ElementDetails {
  atomicNumber: number;
  symbol: string;
  nameEn: string;
  nameTr: string;
  period: number;
  group: number;
  category: ElementCategory;
  block: ElementBlock;
  series?: ElementSeries;
  seriesIndex?: number;
}

const ELEMENTS: PeriodicElement[] = [
  { atomicNumber: 1, symbol: 'H', nameEn: 'Hydrogen', nameTr: 'Hidrojen', period: 1, group: 1, category: 'nonmetal', block: 's' },
  { atomicNumber: 2, symbol: 'He', nameEn: 'Helium', nameTr: 'Helyum', period: 1, group: 18, category: 'noble-gas', block: 's' },
  { atomicNumber: 3, symbol: 'Li', nameEn: 'Lithium', nameTr: 'Lityum', period: 2, group: 1, category: 'alkali-metal', block: 's' },
  { atomicNumber: 4, symbol: 'Be', nameEn: 'Beryllium', nameTr: 'Berilyum', period: 2, group: 2, category: 'alkaline-earth', block: 's' },
  { atomicNumber: 5, symbol: 'B', nameEn: 'Boron', nameTr: 'Bor', period: 2, group: 13, category: 'metalloid', block: 'p' },
  { atomicNumber: 6, symbol: 'C', nameEn: 'Carbon', nameTr: 'Karbon', period: 2, group: 14, category: 'nonmetal', block: 'p' },
  { atomicNumber: 7, symbol: 'N', nameEn: 'Nitrogen', nameTr: 'Azot', period: 2, group: 15, category: 'nonmetal', block: 'p' },
  { atomicNumber: 8, symbol: 'O', nameEn: 'Oxygen', nameTr: 'Oksijen', period: 2, group: 16, category: 'nonmetal', block: 'p' },
  { atomicNumber: 9, symbol: 'F', nameEn: 'Fluorine', nameTr: 'Flor', period: 2, group: 17, category: 'halogen', block: 'p' },
  { atomicNumber: 10, symbol: 'Ne', nameEn: 'Neon', nameTr: 'Neon', period: 2, group: 18, category: 'noble-gas', block: 'p' },
  { atomicNumber: 11, symbol: 'Na', nameEn: 'Sodium', nameTr: 'Sodyum', period: 3, group: 1, category: 'alkali-metal', block: 's' },
  { atomicNumber: 12, symbol: 'Mg', nameEn: 'Magnesium', nameTr: 'Magnezyum', period: 3, group: 2, category: 'alkaline-earth', block: 's' },
  { atomicNumber: 13, symbol: 'Al', nameEn: 'Aluminium', nameTr: 'Aluminyum', period: 3, group: 13, category: 'post-transition', block: 'p' },
  { atomicNumber: 14, symbol: 'Si', nameEn: 'Silicon', nameTr: 'Silisyum', period: 3, group: 14, category: 'metalloid', block: 'p' },
  { atomicNumber: 15, symbol: 'P', nameEn: 'Phosphorus', nameTr: 'Fosfor', period: 3, group: 15, category: 'nonmetal', block: 'p' },
  { atomicNumber: 16, symbol: 'S', nameEn: 'Sulfur', nameTr: 'Kukurt', period: 3, group: 16, category: 'nonmetal', block: 'p' },
  { atomicNumber: 17, symbol: 'Cl', nameEn: 'Chlorine', nameTr: 'Klor', period: 3, group: 17, category: 'halogen', block: 'p' },
  { atomicNumber: 18, symbol: 'Ar', nameEn: 'Argon', nameTr: 'Argon', period: 3, group: 18, category: 'noble-gas', block: 'p' },
  { atomicNumber: 19, symbol: 'K', nameEn: 'Potassium', nameTr: 'Potasyum', period: 4, group: 1, category: 'alkali-metal', block: 's' },
  { atomicNumber: 20, symbol: 'Ca', nameEn: 'Calcium', nameTr: 'Kalsiyum', period: 4, group: 2, category: 'alkaline-earth', block: 's' },
  { atomicNumber: 21, symbol: 'Sc', nameEn: 'Scandium', nameTr: 'Skandiyum', period: 4, group: 3, category: 'transition-metal', block: 'd' },
  { atomicNumber: 22, symbol: 'Ti', nameEn: 'Titanium', nameTr: 'Titanyum', period: 4, group: 4, category: 'transition-metal', block: 'd' },
  { atomicNumber: 23, symbol: 'V', nameEn: 'Vanadium', nameTr: 'Vanadyum', period: 4, group: 5, category: 'transition-metal', block: 'd' },
  { atomicNumber: 24, symbol: 'Cr', nameEn: 'Chromium', nameTr: 'Krom', period: 4, group: 6, category: 'transition-metal', block: 'd' },
  { atomicNumber: 25, symbol: 'Mn', nameEn: 'Manganese', nameTr: 'Manganez', period: 4, group: 7, category: 'transition-metal', block: 'd' },
  { atomicNumber: 26, symbol: 'Fe', nameEn: 'Iron', nameTr: 'Demir', period: 4, group: 8, category: 'transition-metal', block: 'd' },
  { atomicNumber: 27, symbol: 'Co', nameEn: 'Cobalt', nameTr: 'Kobalt', period: 4, group: 9, category: 'transition-metal', block: 'd' },
  { atomicNumber: 28, symbol: 'Ni', nameEn: 'Nickel', nameTr: 'Nikel', period: 4, group: 10, category: 'transition-metal', block: 'd' },
  { atomicNumber: 29, symbol: 'Cu', nameEn: 'Copper', nameTr: 'Bakır', period: 4, group: 11, category: 'transition-metal', block: 'd' },
  { atomicNumber: 30, symbol: 'Zn', nameEn: 'Zinc', nameTr: 'Çinko', period: 4, group: 12, category: 'transition-metal', block: 'd' },
  { atomicNumber: 31, symbol: 'Ga', nameEn: 'Gallium', nameTr: 'Galyum', period: 4, group: 13, category: 'post-transition', block: 'p' },
  { atomicNumber: 32, symbol: 'Ge', nameEn: 'Germanium', nameTr: 'Germenyum', period: 4, group: 14, category: 'metalloid', block: 'p' },
  { atomicNumber: 33, symbol: 'As', nameEn: 'Arsenic', nameTr: 'Arsenik', period: 4, group: 15, category: 'metalloid', block: 'p' },
  { atomicNumber: 34, symbol: 'Se', nameEn: 'Selenium', nameTr: 'Selenyum', period: 4, group: 16, category: 'nonmetal', block: 'p' },
  { atomicNumber: 35, symbol: 'Br', nameEn: 'Bromine', nameTr: 'Brom', period: 4, group: 17, category: 'halogen', block: 'p' },
  { atomicNumber: 36, symbol: 'Kr', nameEn: 'Krypton', nameTr: 'Kripton', period: 4, group: 18, category: 'noble-gas', block: 'p' },
  { atomicNumber: 37, symbol: 'Rb', nameEn: 'Rubidium', nameTr: 'Rubidyum', period: 5, group: 1, category: 'alkali-metal', block: 's' },
  { atomicNumber: 38, symbol: 'Sr', nameEn: 'Strontium', nameTr: 'Stronsiyum', period: 5, group: 2, category: 'alkaline-earth', block: 's' },
  { atomicNumber: 39, symbol: 'Y', nameEn: 'Yttrium', nameTr: 'İtriyum', period: 5, group: 3, category: 'transition-metal', block: 'd' },
  { atomicNumber: 40, symbol: 'Zr', nameEn: 'Zirconium', nameTr: 'Zirkonyum', period: 5, group: 4, category: 'transition-metal', block: 'd' },
  { atomicNumber: 41, symbol: 'Nb', nameEn: 'Niobium', nameTr: 'Niyobyum', period: 5, group: 5, category: 'transition-metal', block: 'd' },
  { atomicNumber: 42, symbol: 'Mo', nameEn: 'Molybdenum', nameTr: 'Molibden', period: 5, group: 6, category: 'transition-metal', block: 'd' },
  { atomicNumber: 43, symbol: 'Tc', nameEn: 'Technetium', nameTr: 'Teknesyum', period: 5, group: 7, category: 'transition-metal', block: 'd' },
  { atomicNumber: 44, symbol: 'Ru', nameEn: 'Ruthenium', nameTr: 'Rutenyum', period: 5, group: 8, category: 'transition-metal', block: 'd' },
  { atomicNumber: 45, symbol: 'Rh', nameEn: 'Rhodium', nameTr: 'Rodyum', period: 5, group: 9, category: 'transition-metal', block: 'd' },
  { atomicNumber: 46, symbol: 'Pd', nameEn: 'Palladium', nameTr: 'Paladyum', period: 5, group: 10, category: 'transition-metal', block: 'd' },
  { atomicNumber: 47, symbol: 'Ag', nameEn: 'Silver', nameTr: 'Gümüş', period: 5, group: 11, category: 'transition-metal', block: 'd' },
  { atomicNumber: 48, symbol: 'Cd', nameEn: 'Cadmium', nameTr: 'Kadmiyum', period: 5, group: 12, category: 'transition-metal', block: 'd' },
  { atomicNumber: 49, symbol: 'In', nameEn: 'Indium', nameTr: 'İndiyum', period: 5, group: 13, category: 'post-transition', block: 'p' },
  { atomicNumber: 50, symbol: 'Sn', nameEn: 'Tin', nameTr: 'Kalay', period: 5, group: 14, category: 'post-transition', block: 'p' },
  { atomicNumber: 51, symbol: 'Sb', nameEn: 'Antimony', nameTr: 'Antimon', period: 5, group: 15, category: 'metalloid', block: 'p' },
  { atomicNumber: 52, symbol: 'Te', nameEn: 'Tellurium', nameTr: 'Tellür', period: 5, group: 16, category: 'metalloid', block: 'p' },
  { atomicNumber: 53, symbol: 'I', nameEn: 'Iodine', nameTr: 'İyot', period: 5, group: 17, category: 'halogen', block: 'p' },
  { atomicNumber: 54, symbol: 'Xe', nameEn: 'Xenon', nameTr: 'Ksenon', period: 5, group: 18, category: 'noble-gas', block: 'p' },
  { atomicNumber: 55, symbol: 'Cs', nameEn: 'Cesium', nameTr: 'Sezyum', period: 6, group: 1, category: 'alkali-metal', block: 's' },
  { atomicNumber: 56, symbol: 'Ba', nameEn: 'Barium', nameTr: 'Baryum', period: 6, group: 2, category: 'alkaline-earth', block: 's' },
  { atomicNumber: 57, symbol: 'La', nameEn: 'Lanthanum', nameTr: 'Lantan', period: 6, group: 3, category: 'lanthanide', block: 'f' },
  { atomicNumber: 58, symbol: 'Ce', nameEn: 'Cerium', nameTr: 'Seryum', period: 6, group: 3, category: 'lanthanide', block: 'f', series: 'lanthanide', seriesIndex: 0 },
  { atomicNumber: 59, symbol: 'Pr', nameEn: 'Praseodymium', nameTr: 'Praseodim', period: 6, group: 3, category: 'lanthanide', block: 'f', series: 'lanthanide', seriesIndex: 1 },
  { atomicNumber: 60, symbol: 'Nd', nameEn: 'Neodymium', nameTr: 'Neodimyum', period: 6, group: 3, category: 'lanthanide', block: 'f', series: 'lanthanide', seriesIndex: 2 },
  { atomicNumber: 61, symbol: 'Pm', nameEn: 'Promethium', nameTr: 'Prometyum', period: 6, group: 3, category: 'lanthanide', block: 'f', series: 'lanthanide', seriesIndex: 3 },
  { atomicNumber: 62, symbol: 'Sm', nameEn: 'Samarium', nameTr: 'Samaryum', period: 6, group: 3, category: 'lanthanide', block: 'f', series: 'lanthanide', seriesIndex: 4 },
  { atomicNumber: 63, symbol: 'Eu', nameEn: 'Europium', nameTr: 'Evropiyum', period: 6, group: 3, category: 'lanthanide', block: 'f', series: 'lanthanide', seriesIndex: 5 },
  { atomicNumber: 64, symbol: 'Gd', nameEn: 'Gadolinium', nameTr: 'Gadolinyum', period: 6, group: 3, category: 'lanthanide', block: 'f', series: 'lanthanide', seriesIndex: 6 },
  { atomicNumber: 65, symbol: 'Tb', nameEn: 'Terbium', nameTr: 'Terbiyum', period: 6, group: 3, category: 'lanthanide', block: 'f', series: 'lanthanide', seriesIndex: 7 },
  { atomicNumber: 66, symbol: 'Dy', nameEn: 'Dysprosium', nameTr: 'Disprozyum', period: 6, group: 3, category: 'lanthanide', block: 'f', series: 'lanthanide', seriesIndex: 8 },
  { atomicNumber: 67, symbol: 'Ho', nameEn: 'Holmium', nameTr: 'Holmiyum', period: 6, group: 3, category: 'lanthanide', block: 'f', series: 'lanthanide', seriesIndex: 9 },
  { atomicNumber: 68, symbol: 'Er', nameEn: 'Erbium', nameTr: 'Erbiyum', period: 6, group: 3, category: 'lanthanide', block: 'f', series: 'lanthanide', seriesIndex: 10 },
  { atomicNumber: 69, symbol: 'Tm', nameEn: 'Thulium', nameTr: 'Tuliyum', period: 6, group: 3, category: 'lanthanide', block: 'f', series: 'lanthanide', seriesIndex: 11 },
  { atomicNumber: 70, symbol: 'Yb', nameEn: 'Ytterbium', nameTr: 'İterbiyum', period: 6, group: 3, category: 'lanthanide', block: 'f', series: 'lanthanide', seriesIndex: 12 },
  { atomicNumber: 71, symbol: 'Lu', nameEn: 'Lutetium', nameTr: 'Lutesyum', period: 6, group: 3, category: 'lanthanide', block: 'f', series: 'lanthanide', seriesIndex: 13 },
  { atomicNumber: 72, symbol: 'Hf', nameEn: 'Hafnium', nameTr: 'Hafniyum', period: 6, group: 4, category: 'transition-metal', block: 'd' },
  { atomicNumber: 73, symbol: 'Ta', nameEn: 'Tantalum', nameTr: 'Tantal', period: 6, group: 5, category: 'transition-metal', block: 'd' },
  { atomicNumber: 74, symbol: 'W', nameEn: 'Tungsten', nameTr: 'Tungsten', period: 6, group: 6, category: 'transition-metal', block: 'd' },
  { atomicNumber: 75, symbol: 'Re', nameEn: 'Rhenium', nameTr: 'Renyum', period: 6, group: 7, category: 'transition-metal', block: 'd' },
  { atomicNumber: 76, symbol: 'Os', nameEn: 'Osmium', nameTr: 'Osmiyum', period: 6, group: 8, category: 'transition-metal', block: 'd' },
  { atomicNumber: 77, symbol: 'Ir', nameEn: 'Iridium', nameTr: 'İridyum', period: 6, group: 9, category: 'transition-metal', block: 'd' },
  { atomicNumber: 78, symbol: 'Pt', nameEn: 'Platinum', nameTr: 'Platin', period: 6, group: 10, category: 'transition-metal', block: 'd' },
  { atomicNumber: 79, symbol: 'Au', nameEn: 'Gold', nameTr: 'Altın', period: 6, group: 11, category: 'transition-metal', block: 'd' },
  { atomicNumber: 80, symbol: 'Hg', nameEn: 'Mercury', nameTr: 'Cıva', period: 6, group: 12, category: 'transition-metal', block: 'd' },
  { atomicNumber: 81, symbol: 'Tl', nameEn: 'Thallium', nameTr: 'Talyum', period: 6, group: 13, category: 'post-transition', block: 'p' },
  { atomicNumber: 82, symbol: 'Pb', nameEn: 'Lead', nameTr: 'Kurşun', period: 6, group: 14, category: 'post-transition', block: 'p' },
  { atomicNumber: 83, symbol: 'Bi', nameEn: 'Bismuth', nameTr: 'Bizmut', period: 6, group: 15, category: 'post-transition', block: 'p' },
  { atomicNumber: 84, symbol: 'Po', nameEn: 'Polonium', nameTr: 'Polonyum', period: 6, group: 16, category: 'post-transition', block: 'p' },
  { atomicNumber: 85, symbol: 'At', nameEn: 'Astatine', nameTr: 'Astatin', period: 6, group: 17, category: 'halogen', block: 'p' },
  { atomicNumber: 86, symbol: 'Rn', nameEn: 'Radon', nameTr: 'Radon', period: 6, group: 18, category: 'noble-gas', block: 'p' },
  { atomicNumber: 87, symbol: 'Fr', nameEn: 'Francium', nameTr: 'Fransiyum', period: 7, group: 1, category: 'alkali-metal', block: 's' },
  { atomicNumber: 88, symbol: 'Ra', nameEn: 'Radium', nameTr: 'Radyum', period: 7, group: 2, category: 'alkaline-earth', block: 's' },
  { atomicNumber: 89, symbol: 'Ac', nameEn: 'Actinium', nameTr: 'Aktinyum', period: 7, group: 3, category: 'actinide', block: 'f' },
  { atomicNumber: 90, symbol: 'Th', nameEn: 'Thorium', nameTr: 'Toryum', period: 7, group: 3, category: 'actinide', block: 'f', series: 'actinide', seriesIndex: 0 },
  { atomicNumber: 91, symbol: 'Pa', nameEn: 'Protactinium', nameTr: 'Protaktinyum', period: 7, group: 3, category: 'actinide', block: 'f', series: 'actinide', seriesIndex: 1 },
  { atomicNumber: 92, symbol: 'U', nameEn: 'Uranium', nameTr: 'Uranyum', period: 7, group: 3, category: 'actinide', block: 'f', series: 'actinide', seriesIndex: 2 },
  { atomicNumber: 93, symbol: 'Np', nameEn: 'Neptunium', nameTr: 'Neptünyum', period: 7, group: 3, category: 'actinide', block: 'f', series: 'actinide', seriesIndex: 3 },
  { atomicNumber: 94, symbol: 'Pu', nameEn: 'Plutonium', nameTr: 'Plütonyum', period: 7, group: 3, category: 'actinide', block: 'f', series: 'actinide', seriesIndex: 4 },
  { atomicNumber: 95, symbol: 'Am', nameEn: 'Americium', nameTr: 'Amerikyum', period: 7, group: 3, category: 'actinide', block: 'f', series: 'actinide', seriesIndex: 5 },
  { atomicNumber: 96, symbol: 'Cm', nameEn: 'Curium', nameTr: 'Küriyum', period: 7, group: 3, category: 'actinide', block: 'f', series: 'actinide', seriesIndex: 6 },
  { atomicNumber: 97, symbol: 'Bk', nameEn: 'Berkelium', nameTr: 'Berkelyum', period: 7, group: 3, category: 'actinide', block: 'f', series: 'actinide', seriesIndex: 7 },
  { atomicNumber: 98, symbol: 'Cf', nameEn: 'Californium', nameTr: 'Kaliforniyum', period: 7, group: 3, category: 'actinide', block: 'f', series: 'actinide', seriesIndex: 8 },
  { atomicNumber: 99, symbol: 'Es', nameEn: 'Einsteinium', nameTr: 'Einsteinyum', period: 7, group: 3, category: 'actinide', block: 'f', series: 'actinide', seriesIndex: 9 },
  { atomicNumber: 100, symbol: 'Fm', nameEn: 'Fermium', nameTr: 'Fermiyum', period: 7, group: 3, category: 'actinide', block: 'f', series: 'actinide', seriesIndex: 10 },
  { atomicNumber: 101, symbol: 'Md', nameEn: 'Mendelevium', nameTr: 'Mendelevyum', period: 7, group: 3, category: 'actinide', block: 'f', series: 'actinide', seriesIndex: 11 },
  { atomicNumber: 102, symbol: 'No', nameEn: 'Nobelium', nameTr: 'Nobelyum', period: 7, group: 3, category: 'actinide', block: 'f', series: 'actinide', seriesIndex: 12 },
  { atomicNumber: 103, symbol: 'Lr', nameEn: 'Lawrencium', nameTr: 'Lavrensiyum', period: 7, group: 3, category: 'actinide', block: 'f', series: 'actinide', seriesIndex: 13 },
  { atomicNumber: 104, symbol: 'Rf', nameEn: 'Rutherfordium', nameTr: 'Rutherfordyum', period: 7, group: 4, category: 'transition-metal', block: 'd' },
  { atomicNumber: 105, symbol: 'Db', nameEn: 'Dubnium', nameTr: 'Dubniyum', period: 7, group: 5, category: 'transition-metal', block: 'd' },
  { atomicNumber: 106, symbol: 'Sg', nameEn: 'Seaborgium', nameTr: 'Seaborgiyum', period: 7, group: 6, category: 'transition-metal', block: 'd' },
  { atomicNumber: 107, symbol: 'Bh', nameEn: 'Bohrium', nameTr: 'Bohriyum', period: 7, group: 7, category: 'transition-metal', block: 'd' },
  { atomicNumber: 108, symbol: 'Hs', nameEn: 'Hassium', nameTr: 'Hasiyum', period: 7, group: 8, category: 'transition-metal', block: 'd' },
  { atomicNumber: 109, symbol: 'Mt', nameEn: 'Meitnerium', nameTr: 'Meitneriyum', period: 7, group: 9, category: 'transition-metal', block: 'd' },
  { atomicNumber: 110, symbol: 'Ds', nameEn: 'Darmstadtium', nameTr: 'Darmstadtiyum', period: 7, group: 10, category: 'transition-metal', block: 'd' },
  { atomicNumber: 111, symbol: 'Rg', nameEn: 'Roentgenium', nameTr: 'Röntgenyum', period: 7, group: 11, category: 'transition-metal', block: 'd' },
  { atomicNumber: 112, symbol: 'Cn', nameEn: 'Copernicium', nameTr: 'Kopernikyum', period: 7, group: 12, category: 'transition-metal', block: 'd' },
  { atomicNumber: 113, symbol: 'Nh', nameEn: 'Nihonium', nameTr: 'Nihonyum', period: 7, group: 13, category: 'post-transition', block: 'p' },
  { atomicNumber: 114, symbol: 'Fl', nameEn: 'Flerovium', nameTr: 'Flerovyum', period: 7, group: 14, category: 'post-transition', block: 'p' },
  { atomicNumber: 115, symbol: 'Mc', nameEn: 'Moscovium', nameTr: 'Moskovyum', period: 7, group: 15, category: 'post-transition', block: 'p' },
  { atomicNumber: 116, symbol: 'Lv', nameEn: 'Livermorium', nameTr: 'Livermoryum', period: 7, group: 16, category: 'post-transition', block: 'p' },
  { atomicNumber: 117, symbol: 'Ts', nameEn: 'Tennessine', nameTr: 'Tennessin', period: 7, group: 17, category: 'halogen', block: 'p' },
  { atomicNumber: 118, symbol: 'Og', nameEn: 'Oganesson', nameTr: 'Oganesson', period: 7, group: 18, category: 'noble-gas', block: 'p' },
];

type Language = 'tr' | 'en';

const CATEGORY_LABELS: Record<ElementCategory, Record<Language, string>> = {
  'alkali-metal': { tr: 'Alkali Metal', en: 'Alkali Metal' },
  'alkaline-earth': { tr: 'Toprak Alkali', en: 'Alkaline Earth' },
  'transition-metal': { tr: 'Geçiş Metali', en: 'Transition Metal' },
  'post-transition': { tr: 'Geçiş Sonrası', en: 'Post-Transition' },
  'metalloid': { tr: 'Yarı Metal', en: 'Metalloid' },
  'nonmetal': { tr: 'Ametal', en: 'Nonmetal' },
  'halogen': { tr: 'Halojen', en: 'Halogen' },
  'noble-gas': { tr: 'Soygaz', en: 'Noble Gas' },
  'lanthanide': { tr: 'Lantanit', en: 'Lanthanide' },
  'actinide': { tr: 'Aktinit', en: 'Actinide' },
  'unknown': { tr: 'Bilinmeyen', en: 'Unknown' },
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

const DETAIL_TEXT: Record<
  'atomicNumber' | 'period' | 'group' | 'block' | 'category' | 'atomicWeight' | 'electronConfig' | 'isotopes',
  Record<Language, { label: string; hint: string }>
> = {
  atomicNumber: {
    tr: { label: 'Atom No', hint: 'Periyodik tablodaki sıra numarası' },
    en: { label: 'Atomic No', hint: 'Position in the periodic table' },
  },
  period: {
    tr: { label: 'Periyot', hint: 'Elektron katman sayısı' },
    en: { label: 'Period', hint: 'Number of electron shells' },
  },
  group: {
    tr: { label: 'Grup', hint: 'Benzer kimyasal özellikler' },
    en: { label: 'Group', hint: 'Elements with similar properties' },
  },
  block: {
    tr: { label: 'Blok', hint: 'Valans elektron alt kabuğu' },
    en: { label: 'Block', hint: 'Valence electron subshell' },
  },
  category: {
    tr: { label: 'Kategori', hint: 'Metaller, ametaller ve türevleri' },
    en: { label: 'Category', hint: 'Metals, nonmetals, and more' },
  },
  atomicWeight: {
    tr: { label: 'Atom Ağırlığı', hint: 'Ortalama atomik kütle (u)' },
    en: { label: 'Atomic Weight', hint: 'Average atomic mass (u)' },
  },
  electronConfig: {
    tr: { label: 'Elektron Dizilimi', hint: 'Elektronların kabuk dağılımı' },
    en: { label: 'Electron Config', hint: 'Electron shell distribution' },
  },
  isotopes: {
    tr: { label: 'Yaygın İzotoplar', hint: 'Doğada en çok görülenler' },
    en: { label: 'Common Isotopes', hint: 'Most naturally abundant' },
  },
};

const EMPTY_DETAIL_TEXT: Record<Language, string> = {
  tr: 'Detayları görmek için bir element seçin.',
  en: 'Select an element to see its details.',
};

const ISOTOPE_TOOLTIP_TEXT: Record<
  'abundance' | 'halfLife' | 'decayMode' | 'stable',
  Record<Language, string>
> = {
  abundance: { tr: 'Bolluk', en: 'Abundance' },
  halfLife: { tr: 'Yarı ömür', en: 'Half-life' },
  decayMode: { tr: 'Bozunma', en: 'Decay' },
  stable: { tr: 'Stabil', en: 'Stable' },
};

const LANGUAGE_STORAGE_KEY = 'periodicTableLanguage';

@Component({
  selector: 'app-periodic-table',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  templateUrl: './periodic-table.component.html',
  styleUrls: ['./periodic-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PeriodicTableComponent {
  readonly elements = ELEMENTS.map(element => ({
    ...element,
    ...ELEMENT_DETAILS[element.atomicNumber],
  }));
  readonly categoryLegend = CATEGORY_ORDER.map(category => ({
    category,
  }));

  readonly searchQuery = signal('');
  readonly selectedElement = signal<PeriodicElement | null>(null);
  readonly language = signal<'tr' | 'en'>('tr');
  readonly viewMode = signal<'compact' | 'full'>('compact');
  readonly isMobile = signal(false);
  readonly isSheetOpen = signal(false);
  readonly isLegendOpen = signal(false);

  constructor() {
    if (typeof window !== 'undefined') {
      const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language | null;
      if (storedLanguage === 'tr' || storedLanguage === 'en') {
        this.language.set(storedLanguage);
      }
      const isMobile = window.matchMedia('(max-width: 720px)').matches;
      this.isMobile.set(isMobile);
      this.viewMode.set(isMobile ? 'full' : 'compact');
      this.isLegendOpen.set(!isMobile);
    }
  }

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
      element.nameTr.toLowerCase().includes(query) ||
      element.nameEn.toLowerCase().includes(query) ||
      element.symbol.toLowerCase().includes(query) ||
      element.atomicNumber.toString() === query
    );
  }

  selectElement(element: PeriodicElement): void {
    this.selectedElement.set(element);
    if (this.isMobile()) {
      this.isSheetOpen.set(true);
    }
  }

  clearSelection(): void {
    this.selectedElement.set(null);
    this.isSheetOpen.set(false);
  }

  closeSheet(): void {
    this.isSheetOpen.set(false);
  }

  toggleLegend(): void {
    this.isLegendOpen.update(value => !value);
  }

  getCategoryLabel(category: ElementCategory): string {
    return CATEGORY_LABELS[category]?.[this.language()] ?? category;
  }

  getElementName(element: PeriodicElement): string {
    return this.language() === 'tr' ? element.nameTr : element.nameEn;
  }

  setLanguage(language: Language): void {
    this.language.set(language);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    }
  }

  getValue(value?: string | number): string {
    if (value === null || value === undefined) return '—';
    const text = String(value).trim();
    return text ? text : '—';
  }

  getIsotopes(value?: PeriodicElement['commonIsotopes']): PeriodicElement['commonIsotopes'] {
    return value && value.length ? value : [];
  }

  getDetailLabel(key: keyof typeof DETAIL_TEXT): string {
    return DETAIL_TEXT[key][this.language()].label;
  }

  getDetailHint(key: keyof typeof DETAIL_TEXT): string {
    return DETAIL_TEXT[key][this.language()].hint;
  }

  getEmptyDetailText(): string {
    return EMPTY_DETAIL_TEXT[this.language()];
  }

  getIsotopeTooltip(isotope: NonNullable<PeriodicElement['commonIsotopes']>[number]): string {
    const parts: string[] = [];
    if (isotope.abundance !== undefined) {
      parts.push(`${ISOTOPE_TOOLTIP_TEXT.abundance[this.language()]}: ${isotope.abundance}%`);
    }
    if (isotope.isStable) {
      parts.push(ISOTOPE_TOOLTIP_TEXT.stable[this.language()]);
    } else if (isotope.halfLife) {
      const unit = isotope.halfLifeUnit ? ` ${isotope.halfLifeUnit}` : '';
      parts.push(`${ISOTOPE_TOOLTIP_TEXT.halfLife[this.language()]}: ${isotope.halfLife}${unit}`);
    }
    if (isotope.decayMode) {
      parts.push(`${ISOTOPE_TOOLTIP_TEXT.decayMode[this.language()]}: ${isotope.decayMode}`);
    }
    return parts.join(' • ');
  }
}
