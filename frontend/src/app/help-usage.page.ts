import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Card } from "primeng/card";

@Component({
  selector: "app-help-usage-page",
  standalone: true,
  imports: [CommonModule, Card],
  templateUrl: "./help-usage.page.html",
  styleUrls: ["./help-usage.page.scss"],
})
export class HelpUsagePageComponent {}
