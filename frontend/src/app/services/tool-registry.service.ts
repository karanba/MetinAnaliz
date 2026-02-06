import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { Tool, ToolSection, ToolCategory, ToolInfo } from '../models/tool.models';

/**
 * Merkezi Tool Registry Service
 * Tüm tool ve section bilgilerini yönetir.
 * Navigation, katalog ve section sayfaları bu service'i kullanır.
 */
@Injectable({
  providedIn: 'root'
})
export class ToolRegistryService {
  constructor(private router: Router) {}

  /**
   * Merkezi tool veritabanı
   * Yeni tool eklemek için sadece buraya eklemeniz yeterli!
   */
  private readonly _sections = signal<ToolSection[]>([
    {
      id: 'language',
      title: 'Dil Araçları',
      description: 'Metin analizi ve dil işleme araçları',
      icon: 'language',
      route: '/tools/language',
      tools: [
        {
          id: 'text-analysis',
          title: 'Metin Analizi',
          description: 'Metinlerin okunabilirlik ve karmaşıklık analizini yapın. Kelime, cümle ve hece sayılarını hesaplayın.',
          icon: 'file-edit',
          route: '/tools/language/text-analysis',
          color: 'accent',
          category: 'language',
          keywords: ['metin', 'analiz', 'okunabilirlik', 'hece', 'kelime', 'cümle']
        }
      ]
    },
    {
      id: 'engineering',
      title: 'Mühendislik Araçları',
      description: 'Hesaplama ve görselleştirme araçları',
      icon: 'cog',
      route: '/tools/engineering',
      tools: [
        {
          id: 'calculator',
          title: 'Hesap Makinesi',
          description: 'Bilimsel hesaplamalar ve matematiksel ifadeler için gelişmiş hesap makinesi',
          icon: 'calculator',
          route: '/tools/engineering/calculator',
          color: 'sun',
          category: 'engineering',
          keywords: ['hesap', 'matematik', 'bilimsel', 'formül']
        },
        {
          id: 'graph',
          title: 'Grafik Çizimi',
          description: 'Matematiksel fonksiyonları 2D ve 3D olarak görselleştirin',
          icon: 'chart-line',
          route: '/tools/engineering/graph',
          color: 'sun',
          category: 'engineering',
          keywords: ['grafik', 'fonksiyon', '2d', '3d', 'çizim']
        },
        {
          id: 'stl-viewer',
          title: 'STL Görüntüleyici',
          description: '3D STL dosyalarını görüntüleyin, ölçün ve analiz edin',
          icon: 'box',
          route: '/tools/engineering/stl-viewer',
          color: 'sun',
          category: 'engineering',
          keywords: ['stl', '3d', 'model', 'cad']
        }
      ]
    },
    {
      id: 'design',
      title: 'Tasarım Araçları',
      description: 'Renk, tipografi ve görsel tasarım araçları',
      icon: 'palette',
      route: '/tools/design',
      tools: [
        {
          id: 'color-converter',
          title: 'Renk Dönüştürücü',
          description: 'Renk formatları arası dönüşüm, palet oluşturma ve kontrast kontrolü',
          icon: 'palette',
          route: '/tools/design/color-converter',
          color: 'accent',
          category: 'design',
          keywords: ['renk', 'rgb', 'hex', 'hsl', 'palet', 'kontrast']
        }
      ]
    },
    {
      id: 'geo',
      title: 'Harita Araçları',
      description: 'Coğrafi analiz ve görselleştirme araçları',
      icon: 'map',
      route: '/tools/geo',
      tools: [
        {
          id: 'map-tools',
          title: 'Harita',
          description: 'İnteraktif harita, mesafe ve alan ölçümü, koordinat bulma',
          icon: 'map',
          route: '/tools/geo/map-tools',
          color: 'accent',
          category: 'geo',
          keywords: ['harita', 'ölçüm', 'mesafe', 'alan', 'koordinat', 'konum']
        },
        {
          id: 'earthquake',
          title: 'Deprem Bilgi Sistemi',
          description: 'Dünya genelinde gerçek zamanlı deprem verileri ve harita görselleştirmesi',
          icon: 'wave-pulse',
          route: '/tools/geo/earthquake',
          color: 'sun',
          category: 'geo',
          keywords: ['deprem', 'sismik', 'earthquake', 'usgs', 'magnitude']
        },
        {
          id: 'airports',
          title: 'Havaalanları',
          description: 'Dünya genelinde havaalanı bilgileri ve harita üzerinde görüntüleme',
          icon: 'send',
          route: '/tools/geo/airports',
          color: 'accent',
          category: 'geo',
          keywords: ['havaalanı', 'airport', 'uçuş', 'iata', 'icao']
        }
      ]
    },
    {
      id: 'file',
      title: 'Dosya Araçları',
      description: 'PDF dönüştürme, birleştirme ve dosya işlemleri',
      icon: 'file',
      route: '/tools/file',
      tools: [
        {
          id: 'pdf-tools',
          title: 'PDF → Word',
          description: 'PDF dosyalarını Word (DOCX) formatına dönüştürün',
          icon: 'file-pdf',
          route: '/tools/file/pdf-tools',
          color: 'sun',
          category: 'file',
          keywords: ['pdf', 'word', 'docx', 'dönüştür', 'convert']
        },
        {
          id: 'pdf-merge',
          title: 'PDF Birleştir',
          description: 'Birden fazla PDF dosyasını tek bir dosyada birleştirin',
          icon: 'copy',
          route: '/tools/file/pdf-merge',
          color: 'accent',
          category: 'file',
          keywords: ['pdf', 'birleştir', 'merge', 'combine', 'dosya']
        }
      ]
    }
  ]);

  // ============ PUBLIC SIGNALS ============

  /** Tüm section'lar (readonly) */
  readonly sections = this._sections.asReadonly();

  /** Tüm tool'ların düz listesi */
  readonly allTools = computed(() =>
    this._sections().flatMap(section => section.tools)
  );

  /** Toplam tool sayısı */
  readonly toolCount = computed(() => this.allTools().length);

  // ============ GETTER METHODS ============

  /**
   * Belirli bir kategori için section bilgisi
   */
  getSection(category: ToolCategory): ToolSection | undefined {
    return this._sections().find(s => s.id === category);
  }

  /**
   * Belirli bir kategorinin tool'ları
   */
  getToolsByCategory(category: ToolCategory): Tool[] {
    return this.getSection(category)?.tools ?? [];
  }

  /**
   * Belirli bir kategorinin tool'larını ToolInfo formatında döndürür
   * (ToolCard component backward compatibility için)
   */
  getToolInfoByCategory(category: ToolCategory): ToolInfo[] {
    return this.getToolsByCategory(category).map(tool => ({
      title: tool.title,
      description: tool.description,
      icon: 'pi-' + tool.icon,
      route: tool.route,
      color: tool.color
    }));
  }

  /**
   * Route'a göre tool bul
   */
  getToolByRoute(route: string): Tool | undefined {
    return this.allTools().find(t => t.route === route);
  }

  /**
   * ID'ye göre tool bul
   */
  getToolById(id: string): Tool | undefined {
    return this.allTools().find(t => t.id === id);
  }

  /**
   * Anahtar kelimeye göre tool ara
   */
  searchTools(query: string): Tool[] {
    const lowerQuery = query.toLowerCase();
    return this.allTools().filter(tool =>
      tool.title.toLowerCase().includes(lowerQuery) ||
      tool.description.toLowerCase().includes(lowerQuery) ||
      tool.keywords?.some(k => k.toLowerCase().includes(lowerQuery))
    );
  }

  // ============ NAVIGATION HELPERS ============

  /**
   * PrimeNG Menu için MenuItem[] formatına dönüştürür
   */
  getMenuItems(category: ToolCategory): MenuItem[] {
    return this.getToolsByCategory(category).map(tool => ({
      label: tool.title,
      icon: 'pi pi-' + tool.icon,
      command: () => this.router.navigate([tool.route])
    }));
  }

  /**
   * Tüm section'ları MenuItem[] formatında döndürür (ana menu için)
   */
  getAllSectionMenuItems(): MenuItem[] {
    return this._sections().map(section => ({
      label: section.title,
      icon: 'pi pi-' + section.icon,
      items: this.getMenuItems(section.id)
    }));
  }

  /**
   * Belirli bir section route'unun aktif olup olmadığını kontrol eder
   */
  isSectionActive(category: ToolCategory): boolean {
    const section = this.getSection(category);
    return section ? this.router.url.startsWith(section.route) : false;
  }
}
