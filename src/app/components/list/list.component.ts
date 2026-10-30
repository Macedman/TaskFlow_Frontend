import { Component, ElementRef, Input, OnInit, Output, EventEmitter, signal, viewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TaskcardComponent } from '../taskcard/taskcard.component';
import { CommonModule } from '@angular/common';
import { CdkDropListGroup, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { AddCardComponent } from '../add-card/add-card.component';
import { Card, NewCardResponse } from '../../models/card-details.model';
import { BoardsService } from '../../services/boards.service';


@Component({
  selector: 'app-list',
  imports: [TaskcardComponent, CommonModule, CdkDropList, AddCardComponent, ReactiveFormsModule],
  templateUrl: './list.component.html',
  styleUrl: './list.component.css'
})
export class ListComponent implements OnInit {
  @Input() listId: string = '';
  @Input() listTitle: string = '';
  @Input() cards: Card[] = [];

  @Output() dropped = new EventEmitter<CdkDragDrop<Card[]>>();

  isEditingTitle = signal(false);
  titleError = signal(false);
  titleControl = new FormControl('');
  readonly titleInput = viewChild<ElementRef<HTMLInputElement>>('titleInput');

  constructor(private boardsService: BoardsService) {}

  startEditingTitle() {
    this.titleError.set(false);
    this.titleControl.setValue(this.listTitle);
    this.isEditingTitle.set(true);
    //the input is conditionally rendered, wait until it exists before focusing it
    setTimeout(() => this.titleInput()?.nativeElement.select());
  }

  cancelEditingTitle() {
    this.isEditingTitle.set(false);
  }

  saveTitle() {
    //Enter and Esc remove the input, which also fires blur; this stops that blur saving again
    if (!this.isEditingTitle()) return;
    this.isEditingTitle.set(false);

    const name = this.titleControl.value?.trim();
    if (!name || name === this.listTitle) return;

    //show the new title right away, put the old one back if the save fails
    const previousTitle = this.listTitle;
    this.listTitle = name;
    this.boardsService.updateList(this.listId, name).subscribe({
      error: () => {
        this.listTitle = previousTitle;
        this.titleError.set(true);
      }
    });
  }

  onDrop(event: CdkDragDrop<Card[]>) {
    this.dropped.emit(event)
    console.log('List onDrop event:', event);
  }

  //push in place: cards is the same array the board and cdkDropList hold, a new array would split them
  onCardAdded(card: NewCardResponse) {
    this.cards.push({ card_id: card.id, card_title: card.title });
  }


  ngOnInit() {
    console.log('List Component - List Title:', this.listTitle);
    console.log('List Component - Cards:', this.cards);
  }
}
