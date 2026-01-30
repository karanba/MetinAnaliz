import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Card } from "primeng/card";

@Component({
  selector: "app-help-faq-page",
  standalone: true,
  imports: [CommonModule, Card],
  templateUrl: "./help-faq.page.html",
  styleUrls: ["./help-faq.page.scss"],
})
export class HelpFaqPageComponent {}
