import { Component, ElementRef, EventEmitter, inject, Output, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { BoardsService } from '../../services/boards.service';
import { OnInit } from '@angular/core';
import { CardDetails, CardDetailsResponse } from '../../models/card-details.model';

@Component({
  selector: 'app-edit-taskcard-modal',
  imports: [DatePipe, ReactiveFormsModule],
  templateUrl: './edit-taskcard-modal.component.html',
  styleUrl: './edit-taskcard-modal.component.css'
})
export class EditTaskcardModalComponent implements OnInit {
  private data = inject<CardDetails>(DIALOG_DATA);
  private dialogRef = inject(DialogRef);

  @Output() titleChanged = new EventEmitter<string>();

  card: CardDetailsResponse | null = null;
  isLoading = false;
  loadError = false;

  titleControl = new FormControl('');
  titleError = signal(false);

  descriptionControl = new FormControl('');
  isEditingDescription = signal(false);
  isSavingDescription = signal(false);
  descriptionError = signal(false);
  readonly descriptionInput = viewChild<ElementRef<HTMLTextAreaElement>>('descriptionInput');

  constructor(private boardsService: BoardsService) { }

  ngOnInit() {
    this.isLoading = true;
    this.boardsService.getTaskDetails(this.data.cardId).subscribe({
      next: (card) => {
        this.card = card;
        this.titleControl.setValue(card.card_title);
        this.isLoading = false;
      },
      error: () => {
        this.loadError = true;
        this.isLoading = false;
      }
    });
  }

  close() {
    this.dialogRef.close();
  }

  //saving only happens on blur, so Enter and Esc just end the edit and can't save twice
  onTitleEnter(event: Event, input: HTMLTextAreaElement) {
    event.preventDefault(); //a title is one line, don't add a line break
    input.blur();
  }

  onTitleEscape(event: Event, input: HTMLTextAreaElement) {
    event.stopPropagation(); //otherwise Esc also reaches the dialog and closes it
    this.titleControl.setValue(this.card?.card_title ?? '');
    input.blur();
  }

  saveTitle() {
    if (!this.card) return;
    const card = this.card;
    const previousTitle = card.card_title;
    const title = this.titleControl.value?.trim();

    if (!title) {
      this.titleControl.setValue(previousTitle);
      return;
    }
    this.titleControl.setValue(title);
    if (title === previousTitle) return;

    //show the new title right away, put the old one back if the save fails
    this.titleError.set(false);
    card.card_title = title;
    this.boardsService.updateCard(this.data.cardId, { title }).subscribe({
      next: () => this.titleChanged.emit(title),
      error: () => {
        card.card_title = previousTitle;
        this.titleControl.setValue(previousTitle);
        this.titleError.set(true);
      }
    });
  }

  startEditingDescription() {
    this.descriptionError.set(false);
    this.descriptionControl.setValue(this.card?.description ?? '');
    this.isEditingDescription.set(true);
    //the textarea is conditionally rendered, wait until it exists before focusing it
    setTimeout(() => this.descriptionInput()?.nativeElement.focus());
  }

  cancelEditingDescription(event?: Event) {
    event?.stopPropagation(); //otherwise Esc also reaches the dialog and closes it
    this.isEditingDescription.set(false);
  }

  saveDescription() {
    if (!this.card || this.isSavingDescription()) return;
    const card = this.card;
    const typed = this.descriptionControl.value ?? '';
    const description = typed.trim() ? typed : '';

    if (description === (card.description ?? '')) {
      this.isEditingDescription.set(false);
      return;
    }

    //unlike the title, wait for the save: closing first could lose a long description if it fails
    this.descriptionError.set(false);
    this.isSavingDescription.set(true);
    this.boardsService.updateCard(this.data.cardId, { description }).subscribe({
      next: (updated) => {
        card.description = updated.description;
        this.isSavingDescription.set(false);
        this.isEditingDescription.set(false);
      },
      error: () => {
        this.isSavingDescription.set(false);
        this.descriptionError.set(true);
      }
    });
  }
}
