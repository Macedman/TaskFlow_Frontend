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

@Component({
  selector: 'app-taskcard',
  imports: [CdkDrag, CommonModule],
  templateUrl: './taskcard.component.html',
  styleUrl: './taskcard.component.css'
})
export class TaskcardComponent implements OnInit {
  dialog = inject(Dialog);

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
