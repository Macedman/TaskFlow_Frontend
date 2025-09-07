import { Component, inject, Input, OnInit } from '@angular/core';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
  CdkDrag,
  CdkDropList,
} from '@angular/cdk/drag-drop';

import { Dialog } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { EditTaskcardModalComponent } from '../edit-taskcard-modal/edit-taskcard-modal.component';
import { Card } from '../../models/card-details.model';

@Component({
  selector: 'app-taskcard',
  imports: [CdkDrag, CommonModule],
  templateUrl: './taskcard.component.html',
  styleUrl: './taskcard.component.css'
})
export class TaskcardComponent implements OnInit {
  dialog = inject(Dialog);

 @Input() card: Card = { card_id: '', card_title: '' };
 cardTitle: string = '';


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
    console.log('Card Title', this.card.card_title);
    this.cardTitle = this.card.card_title;
    console.log('Card', this.card);
  }

  openDialog() {
    const dialogRef = this.dialog.open<string>(EditTaskcardModalComponent, {
      height: 'auto',
      width: 'auto',
    });

    dialogRef.closed.subscribe(result => {
      console.log('The dialog was closed', result);
    });
  }
}
