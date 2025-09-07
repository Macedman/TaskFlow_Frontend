import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { TaskcardComponent } from '../taskcard/taskcard.component';
import { CommonModule } from '@angular/common';
import { CdkDropListGroup, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { AddCardComponent } from '../add-card/add-card.component';
import { Card } from '../../models/card-details.model';


@Component({
  selector: 'app-list',
  imports: [TaskcardComponent, CommonModule, CdkDropList, AddCardComponent],
  templateUrl: './list.component.html',
  styleUrl: './list.component.css'
})
export class ListComponent implements OnInit {
  @Input() listTitle: string = '';
@Input() cards: Card[] = [];
  cardTitles: string[] = [];

  @Output() dropped = new EventEmitter<CdkDragDrop<string[]>>();

  onDrop(event: CdkDragDrop<string[]>) {
    this.dropped.emit(event)
  }


  ngOnInit() {
    console.log('List Title', this.listTitle);
    console.log('Cards', this.cards); //Array of strings
    this.cardTitles = this.cards.map(card => card.card_title);
    console.log('Card Titles', this.cardTitles); //Array of strings
  }
}
