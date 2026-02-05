import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Card } from "primeng/card";

@Component({
  selector: "app-help-overview",
  standalone: true,
  imports: [CommonModule, Card],
  templateUrl: "./help-overview.component.html",
  styleUrls: ["./help-overview.component.scss"],
})
export class HelpOverviewComponent {}
