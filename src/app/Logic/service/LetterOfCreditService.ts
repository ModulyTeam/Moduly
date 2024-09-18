import { Injectable } from '@angular/core';
import {LetterOfCredit} from "./LetterOfCredit.model";

@Injectable({
  providedIn: 'root'
})
export class LetterOfCreditService {
  private letters: LetterOfCredit[] = [];

  getLetters(): LetterOfCredit[] {
    return this.letters;
  }

  addLetter(letter: LetterOfCredit) {
    this.letters.push(letter);
  }

  removeLetter(id: number) {
    this.letters = this.letters.filter(letter => letter.id !== id);
  }

  updateLetter(updatedLetter: LetterOfCredit) {
    const index = this.letters.findIndex(letter => letter.id === updatedLetter.id);
    if (index !== -1) {
      this.letters[index] = updatedLetter;
    }
  }
}
