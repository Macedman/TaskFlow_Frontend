import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { TaskcardComponent } from '../taskcard/taskcard.component';
import { CommonModule } from '@angular/common';
import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';


@Component({
  selector: 'app-list',
  imports: [TaskcardComponent, CommonModule, CdkDropList],
  templateUrl: './list.component.html',
  styleUrl: './list.component.css'
})
export class ListComponent implements OnInit {
  @Input() listTitle: string = '';
  @Input() cards: string[] = [];
  @Input() connectedTo: string[] = [];

  @Output() dropped = new EventEmitter<CdkDragDrop<string[]>>();

  onDrop(event: CdkDragDrop<string[]>) {
    this.dropped.emit(event)
  }


  ngOnInit() {
    console.log('List Title', this.listTitle);
    console.log('Cards', this.cards);
    console.log('Connected To', this.connectedTo);

  }
}
