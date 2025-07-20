import { Component, signal } from '@angular/core';
import { FormControl, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-card',
  imports: [ReactiveFormsModule],
  templateUrl: './add-card.component.html',
  styleUrl: './add-card.component.css'
})
export class AddCardComponent {

  isAddingCard = signal(false);
  newCard = new FormControl('', Validators.required);


   addCard() {
    this.isAddingCard.set(true);
    console.log(this.isAddingCard());
  }

  cancelAddCard() {
    this.isAddingCard.set(false);
    this.newCard.reset();
    console.log(this.isAddingCard());
  }

  confirmAddCard() {
    console.log(this.isAddingCard());
    console.log(this.newCard.value);
    if (this.newCard.invalid) {
      this.isAddingCard.set(false);
    }
  }
}

