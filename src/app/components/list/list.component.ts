import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { TaskcardComponent } from '../taskcard/taskcard.component';
import { CommonModule } from '@angular/common';
import { CdkDropListGroup, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { AddCardComponent } from '../add-card/add-card.component';
import { Card, NewCardResponse } from '../../models/card-details.model';


@Component({
  selector: 'app-list',
  imports: [TaskcardComponent, CommonModule, CdkDropList, AddCardComponent],
  templateUrl: './list.component.html',
  styleUrl: './list.component.css'
})
export class ListComponent implements OnInit {
  @Input() listId: string = '';
  @Input() listTitle: string = '';
  @Input() cards: Card[] = [];

  @Output() dropped = new EventEmitter<CdkDragDrop<Card[]>>();

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
