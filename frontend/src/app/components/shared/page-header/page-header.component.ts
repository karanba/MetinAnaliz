import {
  Component,
  ChangeDetectionStrategy,
  input,
  AfterViewChecked,
  ViewChild,
  ElementRef,
  PLATFORM_ID,
  inject,
  OnDestroy,
} from "@angular/core";
import { CommonModule, isPlatformBrowser } from "@angular/common";
import { RouterModule } from "@angular/router";

export interface BreadcrumbItem {
  label: string;
  route?: string;
}

@Component({
  selector: "app-page-header",
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./page-header.component.html",
  styleUrl: "./page-header.component.scss",
})
export class PageHeaderComponent implements AfterViewChecked {
  title = input.required<string>();
  description = input<string>();
  breadcrumbs = input<BreadcrumbItem[]>([]);
  showAd = input<boolean>(false);
  adSlot = input<string>("8441819013");

  @ViewChild("adContainer") adContainer?: ElementRef;

  private platformId = inject(PLATFORM_ID);
  private adPushed = false;
  private lastAdElement?: HTMLElement;
  private pushAttempts = 0;
  private pushTimer?: number;

  ngAfterViewChecked(): void {
    this.loadAd();
  }

  private loadAd(): void {
    try {
      const adsbygoogle = (window as any).adsbygoogle || [];
      if (adsbygoogle && !this.adPushed) {
        adsbygoogle.push({});
        this.adPushed = true;
      }
    } catch (e) {
      console.error("AdSense error:", e);
    }
  }

  private isAdRendered(ins: HTMLElement): boolean {
    const status = ins.getAttribute("data-adsbygoogle-status");
    const adStatus = ins.getAttribute("data-ad-status");
    return (
      status === "done" || adStatus === "done" || ins.childElementCount > 0
    );
  }
}
