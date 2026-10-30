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

  
  ngOnInit() {
    this.cardTitle = this.card.card_title;
    console.log('Card Title:', this.cardTitle);
    console.log('Card Details:', this.card);
  }

  openDialog() {
    const dialogRef = this.dialog.open<string, unknown, EditTaskcardModalComponent>(EditTaskcardModalComponent, {
      height: 'auto',
      width: 'auto',
      data: { cardId: this.card.card_id },
    });

    //cardTitle is a copy, so the board only shows a rename if the modal reports it
    dialogRef.componentInstance?.titleChanged.subscribe(title => {
      this.card.card_title = title;
      this.cardTitle = title;
    });

    dialogRef.closed.subscribe(result => {
      console.log('The dialog was closed', result);
    });
  }
}
