import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Card } from "primeng/card";

@Component({
  selector: "app-help-faq",
  standalone: true,
  imports: [CommonModule, Card],
  templateUrl: "./help-faq.component.html",
  styleUrls: ["./help-faq.component.scss"],
})
export class HelpFaqComponent {}
