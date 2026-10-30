import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { BoardsService } from '../../services/boards.service';
import { OnInit } from '@angular/core';
import { CardDetails, CardDetailsResponse } from '../../models/card-details.model';

@Component({
  selector: 'app-edit-taskcard-modal',
  imports: [DatePipe],
  templateUrl: './edit-taskcard-modal.component.html',
  styleUrl: './edit-taskcard-modal.component.css'
})
export class EditTaskcardModalComponent implements OnInit {
  private data = inject<CardDetails>(DIALOG_DATA);
  private dialogRef = inject(DialogRef);

  card: CardDetailsResponse | null = null;
  isLoading = false;
  loadError = false;

  constructor(private boardsService: BoardsService) { }

  ngOnInit() {
    this.isLoading = true;
    this.boardsService.getTaskDetails(this.data.cardId).subscribe({
      next: (card) => {
        this.card = card;
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
}
