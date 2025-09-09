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

  @Output() dropped = new EventEmitter<CdkDragDrop<Card[]>>();

  onDrop(event: CdkDragDrop<Card[]>) {
    this.dropped.emit(event)
    console.log('List onDrop event:', event);
  }


  ngOnInit() {
    console.log('List Component - List Title:', this.listTitle);
    console.log('List Component - Cards:', this.cards);
  }
}
