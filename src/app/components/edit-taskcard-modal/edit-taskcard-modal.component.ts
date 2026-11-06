import { Component, ElementRef, EventEmitter, inject, Output, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { BoardsService } from '../../services/boards.service';
import { OnInit } from '@angular/core';
import { CardAttachment, CardComment, CardDetails, CardDetailsResponse } from '../../models/card-details.model';

// Same limit as the server's
const MAX_PDF_BYTES = 5 * 1024 * 1024;

@Component({
  selector: 'app-edit-taskcard-modal',
  imports: [DatePipe, ReactiveFormsModule],
  templateUrl: './edit-taskcard-modal.component.html',
  styleUrl: './edit-taskcard-modal.component.css'
})
export class EditTaskcardModalComponent implements OnInit {
  private data = inject<CardDetails>(DIALOG_DATA);
  private dialogRef = inject(DialogRef);

  @Output() titleChanged = new EventEmitter<string>();

  card: CardDetailsResponse | null = null;
  isLoading = false;
  loadError = false;

  titleControl = new FormControl('');
  titleError = signal(false);

  descriptionControl = new FormControl('');
  isEditingDescription = signal(false);
  isSavingDescription = signal(false);
  descriptionError = signal(false);
  readonly descriptionInput = viewChild<ElementRef<HTMLTextAreaElement>>('descriptionInput');

  comments = signal<CardComment[]>([]);
  commentsLoadError = signal(false);
  commentControl = new FormControl('');
  isWritingComment = signal(false);
  isSavingComment = signal(false);
  commentError = signal(false);
  readonly commentInput = viewChild<ElementRef<HTMLTextAreaElement>>('commentInput');

  //only decides which buttons to show; the server checks who may edit or delete
  private currentUserId: number | undefined;
  editingCommentId = signal<number | null>(null);
  editCommentControl = new FormControl('');
  isSavingCommentEdit = signal(false);
  commentEditError = signal(false);
  commentDeleteErrorId = signal<number | null>(null);
  readonly editCommentInput = viewChild<ElementRef<HTMLTextAreaElement>>('editCommentInput');

  attachments = signal<CardAttachment[]>([]);
  attachmentsLoadError = signal(false);
  linkUrlControl = new FormControl('');
  linkNameControl = new FormControl('');
  isAddingLink = signal(false);
  isSavingLink = signal(false);
  linkError = signal<'invalid' | 'failed' | null>(null);
  attachmentDeleteErrorId = signal<number | null>(null);
  isUploadingPdf = signal(false);
  pdfError = signal<'too-big' | 'not-pdf' | 'storage-full' | 'failed' | null>(null);
  attachmentDownloadErrorId = signal<number | null>(null);
  readonly linkUrlInput = viewChild<ElementRef<HTMLInputElement>>('linkUrlInput');

  constructor(private boardsService: BoardsService) { }

  ngOnInit() {
    this.currentUserId = JSON.parse(localStorage.getItem('user') || '{}').id;
    this.isLoading = true;
    this.boardsService.getTaskDetails(this.data.cardId).subscribe({
      next: (card) => {
        this.card = card;
        this.titleControl.setValue(card.card_title);
        this.isLoading = false;
      },
      error: () => {
        this.loadError = true;
        this.isLoading = false;
      }
    });

    //loaded on its own, so the card still shows if only the comments fail
    this.boardsService.getComments(this.data.cardId).subscribe({
      next: (comments) => this.comments.set(comments),
      error: () => this.commentsLoadError.set(true)
    });

    this.boardsService.getAttachments(this.data.cardId).subscribe({
      next: (attachments) => this.attachments.set(attachments),
      error: () => this.attachmentsLoadError.set(true)
    });
  }

  close() {
    this.dialogRef.close();
  }

  //saving only happens on blur, so Enter and Esc just end the edit and can't save twice
  onTitleEnter(event: Event, input: HTMLTextAreaElement) {
    event.preventDefault(); //a title is one line, don't add a line break
    input.blur();
  }

  onTitleEscape(event: Event, input: HTMLTextAreaElement) {
    event.stopPropagation(); //otherwise Esc also reaches the dialog and closes it
    this.titleControl.setValue(this.card?.card_title ?? '');
    input.blur();
  }

  saveTitle() {
    if (!this.card) return;
    const card = this.card;
    const previousTitle = card.card_title;
    const title = this.titleControl.value?.trim();

    if (!title) {
      this.titleControl.setValue(previousTitle);
      return;
    }
    this.titleControl.setValue(title);
    if (title === previousTitle) return;

    //show the new title right away, put the old one back if the save fails
    this.titleError.set(false);
    card.card_title = title;
    this.boardsService.updateCard(this.data.cardId, { title }).subscribe({
      next: () => this.titleChanged.emit(title),
      error: () => {
        card.card_title = previousTitle;
        this.titleControl.setValue(previousTitle);
        this.titleError.set(true);
      }
    });
  }

  startEditingDescription() {
    this.descriptionError.set(false);
    this.descriptionControl.setValue(this.card?.description ?? '');
    this.isEditingDescription.set(true);
    //the textarea is conditionally rendered, wait until it exists before focusing it
    setTimeout(() => this.descriptionInput()?.nativeElement.focus());
  }

  cancelEditingDescription(event?: Event) {
    event?.stopPropagation(); //otherwise Esc also reaches the dialog and closes it
    this.isEditingDescription.set(false);
  }

  saveDescription() {
    if (!this.card || this.isSavingDescription()) return;
    const card = this.card;
    const typed = this.descriptionControl.value ?? '';
    const description = typed.trim() ? typed : '';

    if (description === (card.description ?? '')) {
      this.isEditingDescription.set(false);
      return;
    }

    //unlike the title, wait for the save: closing first could lose a long description if it fails
    this.descriptionError.set(false);
    this.isSavingDescription.set(true);
    this.boardsService.updateCard(this.data.cardId, { description }).subscribe({
      next: (updated) => {
        card.description = updated.description;
        this.isSavingDescription.set(false);
        this.isEditingDescription.set(false);
      },
      error: () => {
        this.isSavingDescription.set(false);
        this.descriptionError.set(true);
      }
    });
  }

  startWritingComment() {
    this.commentError.set(false);
    this.isWritingComment.set(true);
    //the textarea is conditionally rendered, wait until it exists before focusing it
    setTimeout(() => this.commentInput()?.nativeElement.focus());
  }

  cancelWritingComment(event?: Event) {
    event?.stopPropagation(); //otherwise Esc also reaches the dialog and closes it
    this.commentControl.setValue('');
    this.isWritingComment.set(false);
  }

  saveComment() {
    const body = this.commentControl.value?.trim();
    if (!body || this.isSavingComment()) return;

    //wait for the save: the server gives the comment its id, author and time
    this.commentError.set(false);
    this.isSavingComment.set(true);
    this.boardsService.addComment(this.data.cardId, body).subscribe({
      next: (comment) => {
        this.comments.update(comments => [comment, ...comments]); //newest first, like getComments
        this.commentControl.setValue('');
        this.isSavingComment.set(false);
        this.isWritingComment.set(false);
      },
      error: () => {
        this.isSavingComment.set(false);
        this.commentError.set(true);
      }
    });
  }

  canEditComment(comment: CardComment) {
    return comment.user_id === this.currentUserId;
  }

  canDeleteComment(comment: CardComment) {
    return this.canEditComment(comment) || this.card?.board_owner_id === this.currentUserId;
  }

  startEditingComment(comment: CardComment) {
    this.commentEditError.set(false);
    this.editCommentControl.setValue(comment.body);
    this.editingCommentId.set(comment.comment_id);
    setTimeout(() => this.editCommentInput()?.nativeElement.focus());
  }

  cancelEditingComment(event?: Event) {
    event?.stopPropagation(); //otherwise Esc also reaches the dialog and closes it
    this.editingCommentId.set(null);
  }

  saveCommentEdit(comment: CardComment) {
    if (this.isSavingCommentEdit()) return;
    const body = this.editCommentControl.value?.trim();

    //a blank or unchanged edit just closes, like the description editor
    if (!body || body === comment.body) {
      this.editingCommentId.set(null);
      return;
    }

    this.commentEditError.set(false);
    this.isSavingCommentEdit.set(true);
    this.boardsService.updateComment(comment.comment_id, body).subscribe({
      next: (updated) => {
        this.comments.update(comments => comments.map(c => c.comment_id === updated.comment_id ? updated : c));
        this.isSavingCommentEdit.set(false);
        this.editingCommentId.set(null);
      },
      error: () => {
        this.isSavingCommentEdit.set(false);
        this.commentEditError.set(true);
      }
    });
  }

  deleteComment(comment: CardComment) {
    //deleting can't be undone, so ask first
    if (!confirm("Delete this comment? This can't be undone.")) return;

    this.commentDeleteErrorId.set(null);
    this.boardsService.deleteComment(comment.comment_id).subscribe({
      next: () => this.comments.update(comments => comments.filter(c => c.comment_id !== comment.comment_id)),
      error: () => this.commentDeleteErrorId.set(comment.comment_id)
    });
  }

  startAddingLink() {
    this.linkError.set(null);
    this.pdfError.set(null);
    this.isAddingLink.set(true);
    setTimeout(() => this.linkUrlInput()?.nativeElement.focus());
  }

  cancelAddingLink(event?: Event) {
    event?.stopPropagation(); //otherwise Esc also reaches the dialog and closes it
    this.linkUrlControl.setValue('');
    this.linkNameControl.setValue('');
    this.isAddingLink.set(false);
  }

  saveLink() {
    const url = this.linkUrlControl.value?.trim();
    if (!url || this.isSavingLink()) return;

    //the server decides what counts as a valid link; a 400 means it wasn't http or https
    this.linkError.set(null);
    this.isSavingLink.set(true);
    this.boardsService.addLinkAttachment(this.data.cardId, url, this.linkNameControl.value ?? '').subscribe({
      next: (attachment) => {
        this.attachments.update(attachments => [attachment, ...attachments]); //newest first, like getAttachments
        this.isSavingLink.set(false);
        this.cancelAddingLink();
      },
      error: (err) => {
        this.isSavingLink.set(false);
        this.linkError.set(err?.status === 400 ? 'invalid' : 'failed');
      }
    });
  }

  onPdfChosen(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; //so choosing the same file again still fires a change
    if (!file || this.isUploadingPdf()) return;

    //checked here for instant feedback; the server checks both again since this is easy to bypass
    this.pdfError.set(null);
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      this.pdfError.set('not-pdf');
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      this.pdfError.set('too-big');
      return;
    }

    this.isUploadingPdf.set(true);
    this.boardsService.uploadPdfAttachment(this.data.cardId, file).subscribe({
      next: (attachment) => {
        this.attachments.update(attachments => [attachment, ...attachments]);
        this.isUploadingPdf.set(false);
        this.cancelAddingLink();
      },
      error: (err) => {
        this.isUploadingPdf.set(false);
        //507: the server's cap on all stored PDFs is reached
        const errors: Record<number, 'not-pdf' | 'too-big' | 'storage-full'> = { 400: 'not-pdf', 413: 'too-big', 507: 'storage-full' };
        this.pdfError.set(errors[err?.status] ?? 'failed');
      }
    });
  }

  downloadAttachment(attachment: CardAttachment) {
    //links expire after a few minutes, so ask for a fresh one on every click
    this.attachmentDownloadErrorId.set(null);
    this.boardsService.getAttachmentDownloadUrl(attachment.attachment_id).subscribe({
      next: (url) => this.startDownload(url),
      error: () => this.attachmentDownloadErrorId.set(attachment.attachment_id)
    });
  }

  //the server answers with Content-Disposition: attachment, so the browser saves the file and stays here
  startDownload(url: string) {
    window.location.assign(url);
  }

  formatSize(bytes: number | null) {
    if (bytes === null) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  canDeleteAttachment(attachment: CardAttachment) {
    return attachment.user_id === this.currentUserId || this.card?.board_owner_id === this.currentUserId;
  }

  deleteAttachment(attachment: CardAttachment) {
    if (!confirm("Delete this attachment? This can't be undone.")) return;

    this.attachmentDeleteErrorId.set(null);
    this.boardsService.deleteAttachment(attachment.attachment_id).subscribe({
      next: () => this.attachments.update(list => list.filter(a => a.attachment_id !== attachment.attachment_id)),
      error: () => this.attachmentDeleteErrorId.set(attachment.attachment_id)
    });
  }
}
