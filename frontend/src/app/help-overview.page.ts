import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Card } from "primeng/card";

@Component({
  selector: "app-help-overview-page",
  standalone: true,
  imports: [CommonModule, Card],
  templateUrl: "./help-overview.page.html",
  styleUrls: ["./help-overview.page.scss"],
})
export class HelpOverviewPageComponent {}
