import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class InstitutionIconService {
  private icons: string[] = [];

  constructor() {
    this.generateIcons();
  }

  private generateIcons() {
    const letters = ['a','b','c','d','e','f','g','h'];
    for (let i = 1; i <= 17; i++) {
      for (const letter of letters) {
        this.icons.push(`assets/institution-random-icons/${i}${letter}.svg`);
      }
    }
  }

  getRandomIcon(): string {
    const randomIndex = Math.floor(Math.random() * this.icons.length);
    return this.icons[randomIndex];
  }
}
