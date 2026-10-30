import { Component, ElementRef, signal, viewChild, OnInit, HostListener, Input, Output, EventEmitter } from '@angular/core';
import { FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { BoardsService } from '../../services/boards.service';
import { NewCardResponse } from '../../models/card-details.model';

@Component({
  selector: 'app-add-card',
  imports: [ReactiveFormsModule],
  templateUrl: './add-card.component.html',
  styleUrl: './add-card.component.css'
})
export class AddCardComponent implements OnInit {
  @Input() listId: string = '';
  @Output() cardAdded = new EventEmitter<NewCardResponse>();

  isAddingCard = signal(false);
  newCard = new FormControl('', Validators.required);
  readonly myAddCardTextArea = viewChild<ElementRef<HTMLTextAreaElement>>('myAddCardTextArea');
  readonly myAddCardDiv = viewChild<ElementRef<HTMLDivElement>>('myAddCardDiv');

  constructor(private boardService: BoardsService) {}

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
  @HostListener('document:keydown.escape', ['$event'])
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
    //Validators.required lets a whitespace-only title through, so check the trimmed value
    const title = this.newCard.value?.trim();
    if (!title || !this.listId) return;

    //send the payload to store new card in DB
    this.boardService.addTask(this.listId, title).subscribe({
      next: (card) => {
        this.cardAdded.emit(card);
        this.newCard.reset();
        this.isAddingCard.set(false);
      },
      //keep the form open so the typed title isn't lost
      error: (err) => console.error('Failed to add card:', err)
    });
  }
}

