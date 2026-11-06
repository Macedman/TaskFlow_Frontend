import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogRef } from '@angular/cdk/dialog';
import { Router } from '@angular/router';
import { BoardsService } from '../../services/boards.service';

// boards.name is VARCHAR(255); the server rejects anything longer
const MAX_NAME_LENGTH = 255;

// Opened from the navbar and from the dashboard's empty state, so creating a board
// (and what its errors say) lives in one place
@Component({
  selector: 'app-create-board-dialog',
  imports: [ReactiveFormsModule],
  templateUrl: './create-board-dialog.component.html',
  styleUrl: './create-board-dialog.component.css'
})
export class CreateBoardDialogComponent {
  private dialogRef = inject(DialogRef);
  private boardsService = inject(BoardsService);
  private router = inject(Router);

  readonly maxLength = MAX_NAME_LENGTH;
  nameControl = new FormControl('', { nonNullable: true, validators: [Validators.maxLength(MAX_NAME_LENGTH)] });
  isCreating = signal(false);
  error = signal<string | null>(null);

  create() {
    const name = this.nameControl.value.trim();
    if (!name || this.nameControl.invalid || this.isCreating()) return;

    this.error.set(null);
    this.isCreating.set(true);
    this.boardsService.createBoard(name).subscribe({
      next: board => {
        this.dialogRef.close();
        this.router.navigate(['/board', board.id]);
      },
      error: (err: HttpErrorResponse) => {
        this.isCreating.set(false);
        this.error.set(err.status === 400
          ? `Enter a board name (up to ${MAX_NAME_LENGTH} characters).`
          : "Couldn't create the board. Try again.");
      }
    });
  }

  close() {
    this.dialogRef.close();
  }
}
