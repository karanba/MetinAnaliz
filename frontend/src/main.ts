import { bootstrapApplication } from "@angular/platform-browser";
import { provideRouter } from "@angular/router";
import { provideHttpClient } from "@angular/common/http";
import { provideAnimations } from "@angular/platform-browser/animations";
import { providePrimeNG } from "primeng/config";
import Lara from "@primeuix/themes/lara";
import { routes } from "./app/app.routes";
import { AppComponent } from "./app/app.component";

// Leaflet marker icon fix
import { initLeafletIcons } from "./app/config/leaflet.config";
initLeafletIcons();

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideAnimations(),
    providePrimeNG({
      ripple: true,
      theme: {
        preset: Lara,
        options: {
          darkModeSelector: false,
        },
      },
    }),
  ],
}).catch((err) => console.error(err));
