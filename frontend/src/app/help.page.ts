import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Card } from "primeng/card";
import { Tag } from "primeng/tag";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";

@Component({
  selector: "app-help-page",
  standalone: true,
  imports: [CommonModule, Card, Tag, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: "./help.page.html",
  styleUrls: ["./help.page.scss"],
})
export class HelpPageComponent {}
