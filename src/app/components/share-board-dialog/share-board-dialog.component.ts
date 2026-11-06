import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { BoardsService } from '../../services/boards.service';
import { BoardMember } from '../../models/boards.model';

export interface ShareBoardData {
  boardId: string;
}

@Component({
  selector: 'app-share-board-dialog',
  imports: [ReactiveFormsModule],
  templateUrl: './share-board-dialog.component.html',
  styleUrl: './share-board-dialog.component.css'
})
export class ShareBoardDialogComponent implements OnInit {
  private data = inject<ShareBoardData>(DIALOG_DATA);
  private dialogRef = inject(DialogRef);
  private boardsService = inject(BoardsService);

  members = signal<BoardMember[]>([]);
  loadError = signal(false);
  //only decides which controls to show; the server checks who may invite or remove
  isOwner = signal(false);

  emailControl = new FormControl('');
  isInviting = signal(false);
  inviteError = signal<string | null>(null);
  removeErrorId = signal<number | null>(null);

  ngOnInit() {
    const currentUserId = Number(JSON.parse(localStorage.getItem('user') || '{}').id);
    this.boardsService.getBoardMembers(this.data.boardId).subscribe({
      next: members => {
        this.members.set(members);
        this.isOwner.set(members.some(m => m.role === 'owner' && m.user_id === currentUserId));
      },
      error: () => this.loadError.set(true)
    });
  }

  invite() {
    const email = this.emailControl.value?.trim();
    if (!email || this.isInviting()) return;

    this.inviteError.set(null);
    this.isInviting.set(true);
    this.boardsService.addBoardMember(this.data.boardId, email).subscribe({
      next: member => {
        this.members.update(list => [...list, member]);
        this.emailControl.setValue('');
        this.isInviting.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.inviteError.set(this.inviteErrorMessage(err));
        this.isInviting.set(false);
      }
    });
  }

  remove(member: BoardMember) {
    if (!confirm(`Remove ${member.full_name} from this board?`)) return;

    this.removeErrorId.set(null);
    this.boardsService.removeBoardMember(this.data.boardId, member.user_id).subscribe({
      next: () => this.members.update(list => list.filter(m => m.user_id !== member.user_id)),
      error: () => this.removeErrorId.set(member.user_id)
    });
  }

  close() {
    this.dialogRef.close();
  }

  //the server's messages for these are written for people ("No account with that email",
  //"That person is already on this board", "Too many failed invites..."), so show them as they are
  private inviteErrorMessage(err: HttpErrorResponse): string {
    if (err.status === 400) return 'Enter a valid email address.';
    if ([404, 409, 429].includes(err.status) && typeof err.error?.message === 'string') return err.error.message;
    return "Couldn't invite that person. Try again.";
  }
}
