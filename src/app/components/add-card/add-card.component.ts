import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-add-card',
  imports: [],
  templateUrl: './add-card.component.html',
  styleUrl: './add-card.component.css'
})
export class AddCardComponent {

  isAddingCard = signal(false);


   addCard() {
    this.isAddingCard.set(true);
    console.log(this.isAddingCard);
  }

  cancelAddCard() {
    this.isAddingCard.set(false);
    console.log(this.isAddingCard);
  }

  confirmAddCard() {
    console.log(this.isAddingCard);
  }
}

