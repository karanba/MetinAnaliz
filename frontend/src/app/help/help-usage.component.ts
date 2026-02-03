import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Card } from "primeng/card";

@Component({
  selector: "app-help-usage",
  standalone: true,
  imports: [CommonModule, Card],
  templateUrl: "./help-usage.component.html",
  styleUrls: ["./help-usage.component.scss"],
})
export class HelpUsageComponent {}
