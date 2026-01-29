import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Card } from "primeng/card";
import { Tag } from "primeng/tag";

@Component({
  selector: "app-help-page",
  standalone: true,
  imports: [CommonModule, Card, Tag],
  templateUrl: "./help.page.html",
  styleUrls: ["./help.page.scss"],
})
export class HelpPageComponent {}
