import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { DatePipe } from '@angular/common';
import { of, Subject, throwError } from 'rxjs';

import { EditTaskcardModalComponent } from './edit-taskcard-modal.component';
import { BoardsService } from '../../services/boards.service';
import { CardAttachment, CardComment, CardDetailsResponse } from '../../models/card-details.model';

describe('EditTaskcardModalComponent', () => {
  let component: EditTaskcardModalComponent;
  let fixture: ComponentFixture<EditTaskcardModalComponent>;
  let boardsService: jasmine.SpyObj<BoardsService>;
  let dialogRef: jasmine.SpyObj<DialogRef>;

  const details: CardDetailsResponse = {
    card_id: 9, card_title: 'Buy milk', description: 'Semi-skimmed',
    position: 0, due_date: null, created_at: '2026-10-30T00:00:00.000Z',
    list_id: 7, list_name: 'Groceries', board_id: 42, board_name: 'Home', board_owner_id: 5
  };

  beforeEach(async () => {
    boardsService = jasmine.createSpyObj<BoardsService>('BoardsService', ['getTaskDetails', 'updateCard', 'getComments', 'addComment', 'updateComment', 'deleteComment',
      'getAttachments', 'addLinkAttachment', 'deleteAttachment']);
    boardsService.getComments.and.returnValue(of([]));
    boardsService.getAttachments.and.returnValue(of([]));
    dialogRef = jasmine.createSpyObj<DialogRef>('DialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [EditTaskcardModalComponent],
      providers: [
        { provide: DIALOG_DATA, useValue: { cardId: '9' } },
        { provide: DialogRef, useValue: dialogRef },
        { provide: BoardsService, useValue: boardsService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditTaskcardModalComponent);
    component = fixture.componentInstance;
  });

  const text = () => fixture.nativeElement.textContent as string;
  const titleBox = () => fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
  const emptyDescription = () =>
    fixture.nativeElement.querySelector('textarea[placeholder="Add a more detailed description..."]') as HTMLTextAreaElement | null;
  const listButton = () => fixture.nativeElement.querySelector('.list-button') as HTMLButtonElement | null;

  it('should create', () => {
    boardsService.getTaskDetails.and.returnValue(of(details));
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('loads the card it was opened with', () => {
    boardsService.getTaskDetails.and.returnValue(of(details));
    fixture.detectChanges();

    expect(boardsService.getTaskDetails).toHaveBeenCalledOnceWith('9');
  });

  it('renders the title, description and list name from the response', () => {
    boardsService.getTaskDetails.and.returnValue(of(details));
    fixture.detectChanges();

    expect(titleBox().value).toBe('Buy milk');
    expect(text()).toContain('Semi-skimmed');
    expect(listButton()?.textContent).toContain('Groceries');
    expect(emptyDescription()).toBeNull();
  });

  it('shows a read-only placeholder when the card has no description', () => {
    boardsService.getTaskDetails.and.returnValue(of({ ...details, description: null }));
    fixture.detectChanges();

    expect(emptyDescription()).not.toBeNull();
    expect(emptyDescription()?.readOnly).toBeTrue();
  });

  // The Attachments section only shows for real attachments, and there is no card creator in the data
  it('does not show placeholder attachments or a made-up author', () => {
    boardsService.getTaskDetails.and.returnValue(of(details));
    fixture.detectChanges();

    expect(text()).not.toContain('Attachments');
    expect(text()).not.toContain('Project Idea.docx');
    expect(text()).not.toContain('Eugene Clint Maceda');
  });

  it('shows activity from the real list and created date', () => {
    boardsService.getTaskDetails.and.returnValue(of(details));
    fixture.detectChanges();

    const created = new DatePipe('en-US').transform(details.created_at, 'MMM d, y, h:mm a') as string;
    expect(text()).toContain('Added to Groceries');
    expect(text()).toContain(created);
  });

  it('closes the dialog from the X button', () => {
    boardsService.getTaskDetails.and.returnValue(of(details));
    fixture.detectChanges();

    fixture.nativeElement.querySelector('button[aria-label="Close"]').click();

    expect(dialogRef.close).toHaveBeenCalledTimes(1);
  });

  describe('editing the title', () => {
    const press = (key: string) =>
      titleBox().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    const type = (value: string) => {
      titleBox().value = value;
      titleBox().dispatchEvent(new Event('input'));
    };

    beforeEach(() => {
      boardsService.getTaskDetails.and.returnValue(of({ ...details }));
      fixture.detectChanges();
      document.body.appendChild(fixture.nativeElement);
      titleBox().focus();
    });

    afterEach(() => fixture.nativeElement.remove());

    it('saves the trimmed title on Enter, sends one request and tells the board', () => {
      boardsService.updateCard.and.returnValue(of({ card_id: 9, card_title: 'Buy oat milk', description: 'Semi-skimmed' }));
      const changed = jasmine.createSpy('titleChanged');
      component.titleChanged.subscribe(changed);

      type('  Buy oat milk  ');
      press('Enter');

      expect(boardsService.updateCard).toHaveBeenCalledOnceWith('9', { title: 'Buy oat milk' });
      expect(changed).toHaveBeenCalledOnceWith('Buy oat milk');
      expect(titleBox().value).toBe('Buy oat milk');
    });

    it('saves when the title loses focus', () => {
      boardsService.updateCard.and.returnValue(of({ card_id: 9, card_title: 'Buy oat milk', description: null }));

      type('Buy oat milk');
      titleBox().blur();

      expect(boardsService.updateCard).toHaveBeenCalledOnceWith('9', { title: 'Buy oat milk' });
    });

    it('does not send a request for an unchanged title', () => {
      titleBox().blur();

      expect(boardsService.updateCard).not.toHaveBeenCalled();
    });

    it('puts the old title back for a blank title, without a request', () => {
      type('   ');
      titleBox().blur();

      expect(boardsService.updateCard).not.toHaveBeenCalled();
      expect(titleBox().value).toBe('Buy milk');
    });

    it('cancels on Esc without closing the dialog', () => {
      const reachedDocument = jasmine.createSpy('reachedDocument');
      document.addEventListener('keydown', reachedDocument);

      type('Changed my mind');
      press('Escape');
      document.removeEventListener('keydown', reachedDocument);

      expect(titleBox().value).toBe('Buy milk');
      expect(boardsService.updateCard).not.toHaveBeenCalled();
      // CDK closes the dialog from a document-level listener, so Esc must not get that far
      expect(reachedDocument).not.toHaveBeenCalled();
    });

    it('puts the old title back and reports it when the save fails', () => {
      boardsService.updateCard.and.returnValue(throwError(() => new Error('500')));
      const changed = jasmine.createSpy('titleChanged');
      component.titleChanged.subscribe(changed);

      type('Buy oat milk');
      titleBox().blur();
      fixture.detectChanges();

      expect(titleBox().value).toBe('Buy milk');
      expect(changed).not.toHaveBeenCalled();
      expect(text()).toContain("Couldn't save the title.");
    });
  });

  describe('editing the description', () => {
    const editor = () =>
      fixture.nativeElement.querySelector('textarea[aria-label="Card description"]') as HTMLTextAreaElement | null;
    const clickButton = (label: string) =>
      (fixture.nativeElement.querySelector(`button[aria-label="${label}"]`) as HTMLButtonElement).click();
    const type = (value: string) => {
      editor()!.value = value;
      editor()!.dispatchEvent(new Event('input'));
    };
    const start = (card: CardDetailsResponse) => {
      boardsService.getTaskDetails.and.returnValue(of({ ...card }));
      fixture.detectChanges();
      component.startEditingDescription();
      fixture.detectChanges();
    };

    it('opens the editor when the empty placeholder is focused', () => {
      boardsService.getTaskDetails.and.returnValue(of({ ...details, description: null }));
      fixture.detectChanges();

      emptyDescription()!.dispatchEvent(new Event('focus'));
      fixture.detectChanges();

      expect(editor()?.value).toBe('');
    });

    it('opens the editor with the current text from the Edit button', () => {
      boardsService.getTaskDetails.and.returnValue(of({ ...details }));
      fixture.detectChanges();

      clickButton('Edit description');
      fixture.detectChanges();

      expect(editor()?.value).toBe('Semi-skimmed');
    });

    it('saves a new description, shows it and closes the editor', () => {
      boardsService.updateCard.and.returnValue(of({ card_id: 9, card_title: 'Buy milk', description: 'Whole milk' }));
      start(details);

      type('Whole milk');
      clickButton('Save description');
      fixture.detectChanges();

      expect(boardsService.updateCard).toHaveBeenCalledOnceWith('9', { description: 'Whole milk' });
      expect(editor()).toBeNull();
      expect(text()).toContain('Whole milk');
    });

    it('clears the description when the text is removed', () => {
      boardsService.updateCard.and.returnValue(of({ card_id: 9, card_title: 'Buy milk', description: '' }));
      start(details);

      type('   ');
      clickButton('Save description');
      fixture.detectChanges();

      expect(boardsService.updateCard).toHaveBeenCalledOnceWith('9', { description: '' });
      expect(emptyDescription()).not.toBeNull();
    });

    it('closes without a request when nothing changed', () => {
      start(details);

      clickButton('Save description');
      fixture.detectChanges();

      expect(boardsService.updateCard).not.toHaveBeenCalled();
      expect(editor()).toBeNull();
    });

    it('cancel drops the text and Esc does not close the dialog', () => {
      start(details);
      const reachedDocument = jasmine.createSpy('reachedDocument');
      document.body.appendChild(fixture.nativeElement);
      document.addEventListener('keydown', reachedDocument);

      type('Throw this away');
      editor()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      fixture.detectChanges();
      document.removeEventListener('keydown', reachedDocument);
      fixture.nativeElement.remove();

      expect(editor()).toBeNull();
      expect(reachedDocument).not.toHaveBeenCalled();
      expect(text()).toContain('Semi-skimmed');
      expect(text()).not.toContain('Throw this away');
    });

    it('keeps the typed text and reports it when the save fails', () => {
      boardsService.updateCard.and.returnValue(throwError(() => new Error('500')));
      start(details);

      type('Do not lose me');
      clickButton('Save description');
      fixture.detectChanges();

      expect(editor()?.value).toBe('Do not lose me');
      expect(text()).toContain("Couldn't save the description.");
    });

    it('sends one request when Save is clicked twice', () => {
      const pending = new Subject<{ card_id: number; card_title: string; description: string | null }>();
      boardsService.updateCard.and.returnValue(pending);
      start(details);

      type('Whole milk');
      component.saveDescription();
      component.saveDescription();

      expect(boardsService.updateCard).toHaveBeenCalledTimes(1);
    });
  });

  describe('comments', () => {
    const older: CardComment = {
      comment_id: 1, body: 'First comment', created_at: '2026-11-01T09:00:00.000Z', updated_at: null,
      user_id: 1, author_name: 'Sam Lee'
    };
    const newer: CardComment = {
      comment_id: 2, body: 'Second comment', created_at: '2026-11-02T09:00:00.000Z', updated_at: null,
      user_id: 2, author_name: 'Ana Cruz'
    };
    const commentBox = () =>
      fixture.nativeElement.querySelector('textarea[aria-label="Write a comment"]') as HTMLTextAreaElement | null;
    const clickButton = (label: string) =>
      (fixture.nativeElement.querySelector(`button[aria-label="${label}"]`) as HTMLButtonElement).click();
    const type = (value: string) => {
      commentBox()!.value = value;
      commentBox()!.dispatchEvent(new Event('input'));
    };
    const commentBodies = () =>
      Array.from(fixture.nativeElement.querySelectorAll('[data-testid="comment-body"]'))
        .map(el => (el as HTMLElement).textContent?.trim());
    const startWriting = () => {
      fixture.detectChanges();
      clickButton('Write a comment');
      fixture.detectChanges();
    };

    beforeEach(() => {
      boardsService.getTaskDetails.and.returnValue(of({ ...details }));
    });

    it('loads the comments for the card it was opened with', () => {
      fixture.detectChanges();

      expect(boardsService.getComments).toHaveBeenCalledOnceWith('9');
    });

    it('shows each comment with its author, in the order the API returns them', () => {
      boardsService.getComments.and.returnValue(of([newer, older]));
      fixture.detectChanges();

      expect(commentBodies()).toEqual(['Second comment', 'First comment']);
      expect(text()).toContain('Sam Lee');
      expect(text()).toContain('Ana Cruz');
    });

    it('reports when the comments fail to load, but still shows the card', () => {
      boardsService.getComments.and.returnValue(throwError(() => new Error('500')));
      fixture.detectChanges();

      expect(text()).toContain("Couldn't load comments.");
      expect(titleBox().value).toBe('Buy milk');
    });

    it('opens the comment box from the placeholder', () => {
      startWriting();

      expect(commentBox()).not.toBeNull();
    });

    it('saves a trimmed comment, puts it at the top and closes the box', () => {
      boardsService.getComments.and.returnValue(of([older]));
      boardsService.addComment.and.returnValue(of(newer));
      startWriting();

      type('  Second comment  ');
      clickButton('Save comment');
      fixture.detectChanges();

      expect(boardsService.addComment).toHaveBeenCalledOnceWith('9', 'Second comment');
      expect(commentBodies()).toEqual(['Second comment', 'First comment']);
      expect(commentBox()).toBeNull();
    });

    it('does not send a blank comment', () => {
      startWriting();

      type('   ');
      clickButton('Save comment');

      expect(boardsService.addComment).not.toHaveBeenCalled();
    });

    it('keeps the typed text and reports it when the save fails', () => {
      boardsService.addComment.and.returnValue(throwError(() => new Error('500')));
      startWriting();

      type('Do not lose me');
      clickButton('Save comment');
      fixture.detectChanges();

      expect(commentBox()?.value).toBe('Do not lose me');
      expect(text()).toContain("Couldn't save the comment.");
    });

    it('sends one request when Save is clicked twice', () => {
      boardsService.addComment.and.returnValue(new Subject<CardComment>());
      startWriting();

      type('Only once');
      component.saveComment();
      component.saveComment();

      expect(boardsService.addComment).toHaveBeenCalledTimes(1);
    });

    it('Esc closes the comment box without closing the dialog', () => {
      startWriting();
      const reachedDocument = jasmine.createSpy('reachedDocument');
      document.body.appendChild(fixture.nativeElement);
      document.addEventListener('keydown', reachedDocument);

      type('Never mind');
      commentBox()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      fixture.detectChanges();
      document.removeEventListener('keydown', reachedDocument);
      fixture.nativeElement.remove();

      expect(commentBox()).toBeNull();
      expect(reachedDocument).not.toHaveBeenCalled();
      expect(boardsService.addComment).not.toHaveBeenCalled();
    });

    describe('editing and deleting', () => {
      // older is by user 1, newer by user 2; details.board_owner_id is 5
      const loginAs = (id: number) => localStorage.setItem('user', JSON.stringify({ id }));
      const commentItem = (id: number) =>
        fixture.nativeElement.querySelector(`[data-comment-id="${id}"]`) as HTMLElement;
      const buttonIn = (id: number, label: string) =>
        commentItem(id).querySelector(`button[aria-label="${label}"]`) as HTMLButtonElement | null;
      const editBox = () =>
        fixture.nativeElement.querySelector('textarea[aria-label="Edit comment"]') as HTMLTextAreaElement | null;
      const typeEdit = (value: string) => {
        editBox()!.value = value;
        editBox()!.dispatchEvent(new Event('input'));
      };
      const open = (comments: CardComment[]) => {
        boardsService.getComments.and.returnValue(of(comments.map(c => ({ ...c }))));
        fixture.detectChanges();
      };
      const startEditing = (id: number) => {
        buttonIn(id, 'Edit comment')!.click();
        fixture.detectChanges();
      };

      let savedUser: string | null;
      beforeEach(() => {
        savedUser = localStorage.getItem('user');
        loginAs(1);
      });
      afterEach(() => {
        if (savedUser === null) localStorage.removeItem('user');
        else localStorage.setItem('user', savedUser);
      });

      it('shows Edit and Delete only on your own comments', () => {
        open([newer, older]);

        expect(buttonIn(1, 'Edit comment')).not.toBeNull();
        expect(buttonIn(1, 'Delete comment')).not.toBeNull();
        expect(buttonIn(2, 'Edit comment')).toBeNull();
        expect(buttonIn(2, 'Delete comment')).toBeNull();
      });

      it('lets the board owner delete, but not edit, other comments', () => {
        loginAs(5);
        open([newer, older]);

        expect(buttonIn(2, 'Delete comment')).not.toBeNull();
        expect(buttonIn(2, 'Edit comment')).toBeNull();
      });

      it('marks a comment that has been edited', () => {
        open([{ ...older, updated_at: '2026-11-03T09:00:00.000Z' }, newer]);

        expect(commentItem(1).textContent).toContain('(edited)');
        expect(commentItem(2).textContent).not.toContain('(edited)');
      });

      it('saves an edit, shows the new text and marks it edited', () => {
        boardsService.updateComment.and.returnValue(of({ ...older, body: 'Fixed typo', updated_at: '2026-11-04T09:00:00.000Z' }));
        open([older]);
        startEditing(1);

        expect(editBox()?.value).toBe('First comment');
        typeEdit('  Fixed typo  ');
        buttonIn(1, 'Save comment edit')!.click();
        fixture.detectChanges();

        expect(boardsService.updateComment).toHaveBeenCalledOnceWith(1, 'Fixed typo');
        expect(editBox()).toBeNull();
        expect(commentBodies()).toEqual(['Fixed typo']);
        expect(commentItem(1).textContent).toContain('(edited)');
      });

      it('closes without a request when the text is unchanged or blank', () => {
        open([older]);
        startEditing(1);
        buttonIn(1, 'Save comment edit')!.click();
        fixture.detectChanges();

        startEditing(1);
        typeEdit('   ');
        buttonIn(1, 'Save comment edit')!.click();
        fixture.detectChanges();

        expect(boardsService.updateComment).not.toHaveBeenCalled();
        expect(commentBodies()).toEqual(['First comment']);
      });

      it('keeps the edit open with the typed text when the save fails', () => {
        boardsService.updateComment.and.returnValue(throwError(() => new Error('500')));
        open([older]);
        startEditing(1);

        typeEdit('Do not lose me');
        buttonIn(1, 'Save comment edit')!.click();
        fixture.detectChanges();

        expect(editBox()?.value).toBe('Do not lose me');
        expect(commentItem(1).textContent).toContain("Couldn't save the comment.");
      });

      it('Esc cancels the edit without closing the dialog', () => {
        open([older]);
        startEditing(1);
        const reachedDocument = jasmine.createSpy('reachedDocument');
        document.body.appendChild(fixture.nativeElement);
        document.addEventListener('keydown', reachedDocument);

        typeEdit('Never mind');
        editBox()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        fixture.detectChanges();
        document.removeEventListener('keydown', reachedDocument);
        fixture.nativeElement.remove();

        expect(editBox()).toBeNull();
        expect(reachedDocument).not.toHaveBeenCalled();
        expect(commentBodies()).toEqual(['First comment']);
      });

      it('deletes a comment after confirming', () => {
        spyOn(window, 'confirm').and.returnValue(true);
        boardsService.deleteComment.and.returnValue(of({ comment_id: 1 }));
        open([newer, older]);

        buttonIn(1, 'Delete comment')!.click();
        fixture.detectChanges();

        expect(boardsService.deleteComment).toHaveBeenCalledOnceWith(1);
        expect(commentBodies()).toEqual(['Second comment']);
      });

      it('does nothing when the delete is not confirmed', () => {
        spyOn(window, 'confirm').and.returnValue(false);
        open([older]);

        buttonIn(1, 'Delete comment')!.click();
        fixture.detectChanges();

        expect(boardsService.deleteComment).not.toHaveBeenCalled();
        expect(commentBodies()).toEqual(['First comment']);
      });

      it('keeps the comment and reports it when the delete fails', () => {
        spyOn(window, 'confirm').and.returnValue(true);
        boardsService.deleteComment.and.returnValue(throwError(() => new Error('500')));
        open([older]);

        buttonIn(1, 'Delete comment')!.click();
        fixture.detectChanges();

        expect(commentBodies()).toEqual(['First comment']);
        expect(commentItem(1).textContent).toContain("Couldn't delete the comment.");
      });
    });
  });

  describe('link attachments', () => {
    // spec is by user 1, docs by user 2; details.board_owner_id is 5
    const spec: CardAttachment = {
      attachment_id: 1, kind: 'link', name: 'The spec', url: 'https://example.com/spec', size_bytes: null,
      created_at: '2026-11-01T09:00:00.000Z', user_id: 1, author_name: 'Sam Lee'
    };
    const docs: CardAttachment = {
      attachment_id: 2, kind: 'link', name: null, url: 'https://docs.example.com/', size_bytes: null,
      created_at: '2026-11-02T09:00:00.000Z', user_id: 2, author_name: 'Ana Cruz'
    };
    const links = () =>
      Array.from(fixture.nativeElement.querySelectorAll('[data-testid="attachment-link"]')) as HTMLAnchorElement[];
    const attachmentItem = (id: number) =>
      fixture.nativeElement.querySelector(`[data-attachment-id="${id}"]`) as HTMLElement;
    const deleteButtonIn = (id: number) =>
      attachmentItem(id).querySelector('button[aria-label="Delete attachment"]') as HTMLButtonElement | null;
    const field = (label: string) =>
      fixture.nativeElement.querySelector(`input[aria-label="${label}"]`) as HTMLInputElement | null;
    const fill = (label: string, value: string) => {
      field(label)!.value = value;
      field(label)!.dispatchEvent(new Event('input'));
    };
    const clickButton = (label: string) =>
      (fixture.nativeElement.querySelector(`button[aria-label="${label}"]`) as HTMLButtonElement).click();
    const open = (attachments: CardAttachment[]) => {
      boardsService.getAttachments.and.returnValue(of(attachments.map(a => ({ ...a }))));
      fixture.detectChanges();
    };
    const startAttaching = () => {
      clickButton('Add attachment');
      fixture.detectChanges();
    };

    let savedUser: string | null;
    beforeEach(() => {
      boardsService.getTaskDetails.and.returnValue(of({ ...details }));
      savedUser = localStorage.getItem('user');
      localStorage.setItem('user', JSON.stringify({ id: 1 }));
    });
    afterEach(() => {
      if (savedUser === null) localStorage.removeItem('user');
      else localStorage.setItem('user', savedUser);
    });

    it('loads the attachments for the card it was opened with', () => {
      open([]);

      expect(boardsService.getAttachments).toHaveBeenCalledOnceWith('9');
    });

    it('lists each link in a new tab, showing its display text or else its address', () => {
      open([docs, spec]);

      expect(text()).toContain('Attachments');
      expect(links().map(a => a.textContent?.trim())).toEqual(['https://docs.example.com/', 'The spec']);
      expect(links()[1].href).toBe('https://example.com/spec');
      expect(links()[1].target).toBe('_blank');
      // the opened page must not get a handle back to this tab
      expect(links()[1].rel).toContain('noopener');
    });

    it('reports when the attachments fail to load, but still shows the card', () => {
      boardsService.getAttachments.and.returnValue(throwError(() => new Error('500')));
      fixture.detectChanges();

      expect(text()).toContain("Couldn't load attachments.");
      expect(titleBox().value).toBe('Buy milk');
    });

    it('attaches a link and puts it at the top', () => {
      boardsService.addLinkAttachment.and.returnValue(of({ ...docs }));
      open([spec]);
      startAttaching();

      fill('Link URL', '  https://docs.example.com  ');
      fill('Link display text', '');
      clickButton('Attach link');
      fixture.detectChanges();

      expect(boardsService.addLinkAttachment).toHaveBeenCalledOnceWith('9', 'https://docs.example.com', '');
      expect(links().map(a => a.textContent?.trim())).toEqual(['https://docs.example.com/', 'The spec']);
      expect(field('Link URL')).toBeNull();
    });

    it('does not send an empty link', () => {
      open([]);
      startAttaching();

      fill('Link URL', '   ');
      clickButton('Attach link');

      expect(boardsService.addLinkAttachment).not.toHaveBeenCalled();
    });

    it('explains a rejected link and keeps what was typed', () => {
      boardsService.addLinkAttachment.and.returnValue(throwError(() => ({ status: 400 })));
      open([]);
      startAttaching();

      fill('Link URL', 'javascript:alert(1)');
      clickButton('Attach link');
      fixture.detectChanges();

      expect(text()).toContain('Enter a link that starts with http:// or https://.');
      expect(field('Link URL')?.value).toBe('javascript:alert(1)');
    });

    it('reports other failures and keeps what was typed', () => {
      boardsService.addLinkAttachment.and.returnValue(throwError(() => ({ status: 500 })));
      open([]);
      startAttaching();

      fill('Link URL', 'https://example.com');
      clickButton('Attach link');
      fixture.detectChanges();

      expect(text()).toContain("Couldn't attach the link.");
      expect(field('Link URL')?.value).toBe('https://example.com');
    });

    it('sends one request when Attach is clicked twice', () => {
      boardsService.addLinkAttachment.and.returnValue(new Subject<CardAttachment>());
      open([]);
      startAttaching();

      fill('Link URL', 'https://example.com');
      component.saveLink();
      component.saveLink();

      expect(boardsService.addLinkAttachment).toHaveBeenCalledTimes(1);
    });

    it('Esc closes the form without closing the dialog', () => {
      open([]);
      startAttaching();
      const reachedDocument = jasmine.createSpy('reachedDocument');
      document.body.appendChild(fixture.nativeElement);
      document.addEventListener('keydown', reachedDocument);

      fill('Link URL', 'https://example.com');
      field('Link URL')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      fixture.detectChanges();
      document.removeEventListener('keydown', reachedDocument);
      fixture.nativeElement.remove();

      expect(field('Link URL')).toBeNull();
      expect(reachedDocument).not.toHaveBeenCalled();
      expect(boardsService.addLinkAttachment).not.toHaveBeenCalled();
    });

    it('shows Delete to the uploader and the board owner only', () => {
      open([docs, spec]);
      expect(deleteButtonIn(1)).not.toBeNull();
      expect(deleteButtonIn(2)).toBeNull();
    });

    it('lets the board owner delete anyone\'s attachment', () => {
      localStorage.setItem('user', JSON.stringify({ id: 5 }));
      open([docs, spec]);

      expect(deleteButtonIn(1)).not.toBeNull();
      expect(deleteButtonIn(2)).not.toBeNull();
    });

    it('deletes an attachment after confirming', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      boardsService.deleteAttachment.and.returnValue(of({ attachment_id: 1 }));
      open([docs, spec]);

      deleteButtonIn(1)!.click();
      fixture.detectChanges();

      expect(boardsService.deleteAttachment).toHaveBeenCalledOnceWith(1);
      expect(links().length).toBe(1);
    });

    it('does nothing when the delete is not confirmed', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      open([spec]);

      deleteButtonIn(1)!.click();

      expect(boardsService.deleteAttachment).not.toHaveBeenCalled();
    });

    it('keeps the attachment and reports it when the delete fails', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      boardsService.deleteAttachment.and.returnValue(throwError(() => new Error('500')));
      open([spec]);

      deleteButtonIn(1)!.click();
      fixture.detectChanges();

      expect(links().length).toBe(1);
      expect(attachmentItem(1).textContent).toContain("Couldn't delete the attachment.");
    });
  });

  it('shows an error and stays open when the request fails', () => {
    boardsService.getTaskDetails.and.returnValue(throwError(() => new Error('404')));
    fixture.detectChanges();

    expect(component.loadError).toBeTrue();
    expect(component.isLoading).toBeFalse();
    expect(text()).toContain("Couldn't load this card.");
    expect(titleBox().value).toBe('');
    expect(listButton()).toBeNull();
    expect(dialogRef.close).not.toHaveBeenCalled();
  });
});
