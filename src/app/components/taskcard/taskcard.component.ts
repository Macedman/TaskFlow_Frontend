import { Component, Input, OnInit } from '@angular/core';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
  CdkDrag,
  CdkDropList,
} from '@angular/cdk/drag-drop';
import { ListType } from '../list/list.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-taskcard',
  imports: [CdkDrag, CommonModule],
  templateUrl: './taskcard.component.html',
  styleUrl: './taskcard.component.css'
})
export class TaskcardComponent implements OnInit {

 @Input() cardTitle: string = '';


  drop(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }
  }
  
  ngOnInit() {
    console.log('Card Title', this.cardTitle);
  }
}
