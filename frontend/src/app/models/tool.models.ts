/**
 * Tool Registry Type Definitions
 * Merkezi tool state management için type-safe interface'ler
 */

/** Tool kategorileri */
export type ToolCategory = 'language' | 'engineering' | 'design' | 'geo' | 'file';

/** Tool renk teması */
export type ToolColor = 'accent' | 'sun';

/** Tek bir tool'un tanımı */
export interface Tool {
  /** Benzersiz tanımlayıcı (örn: 'text-analysis', 'calculator') */
  id: string;
  /** Görüntülenecek başlık */
  title: string;
  /** Kısa açıklama */
  description: string;
  /** PrimeNG icon class'ı (pi- prefix'siz, örn: 'calculator') */
  icon: string;
  /** Tam route path (örn: '/tools/engineering/calculator') */
  route: string;
  /** Renk teması */
  color: ToolColor;
  /** Ait olduğu kategori */
  category: ToolCategory;
  /** Arama için anahtar kelimeler (opsiyonel) */
  keywords?: string[];
}

/** Bir tool kategorisinin (section) tanımı */
export interface ToolSection {
  /** Kategori ID'si */
  id: ToolCategory;
  /** Görüntülenecek başlık */
  title: string;
  /** Kısa açıklama */
  description: string;
  /** PrimeNG icon class'ı (pi- prefix'siz) */
  icon: string;
  /** Section ana route (örn: '/tools/engineering') */
  route: string;
  /** Bu section'a ait tool'lar */
  tools: Tool[];
}

/** ToolCard component'i için backward-compatible alias */
export type ToolInfo = Pick<Tool, 'title' | 'description' | 'icon' | 'route' | 'color'>;
