import { Component, ElementRef, signal, viewChild, OnInit, HostListener } from '@angular/core';
import { FormControl, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-card',
  imports: [ReactiveFormsModule],
  templateUrl: './add-card.component.html',
  styleUrl: './add-card.component.css'
})
export class AddCardComponent implements OnInit {

  isAddingCard = signal(false);
  newCard = new FormControl('', Validators.required);
  readonly myAddCardTextArea = viewChild<ElementRef<HTMLTextAreaElement>>('myAddCardTextArea');
  readonly myAddCardDiv = viewChild<ElementRef<HTMLDivElement>>('myAddCardDiv');


  ngOnInit(): void {

  }

  //listen on outside click
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const clickedInside = this.myAddCardDiv()?.nativeElement.contains(event.target as Node);
    if (!clickedInside) {
      this.isAddingCard.set(false);
    }
  }

  //listen for ESC click
  @HostListener('document:keydown.escape', ['event'])
  onEscapePress(event: KeyboardEvent) {
    this.isAddingCard.set(false);
  }

   addCard() {
    this.isAddingCard.set(true);
    setTimeout(() => {
      if (this.myAddCardTextArea()) {
        this.myAddCardTextArea()?.nativeElement.focus();
      }
    });
  }

  cancelAddCard() {
    this.isAddingCard.set(false);
    this.newCard.reset();
  }

  confirmAddCard() {
    //close add card when invalid
    if (this.newCard.invalid) {
      this.isAddingCard.set(false);
    }
  }
}

