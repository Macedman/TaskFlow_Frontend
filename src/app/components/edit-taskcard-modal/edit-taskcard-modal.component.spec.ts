import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { DatePipe } from '@angular/common';
import { of, Subject, throwError } from 'rxjs';

import { EditTaskcardModalComponent } from './edit-taskcard-modal.component';
import { BoardsService } from '../../services/boards.service';
import { CardDetailsResponse } from '../../models/card-details.model';

describe('EditTaskcardModalComponent', () => {
  let component: EditTaskcardModalComponent;
  let fixture: ComponentFixture<EditTaskcardModalComponent>;
  let boardsService: jasmine.SpyObj<BoardsService>;
  let dialogRef: jasmine.SpyObj<DialogRef>;

  const details: CardDetailsResponse = {
    card_id: 9, card_title: 'Buy milk', description: 'Semi-skimmed',
    position: 0, due_date: null, created_at: '2026-10-30T00:00:00.000Z',
    list_id: 7, list_name: 'Groceries', board_id: 42, board_name: 'Home'
  };

  beforeEach(async () => {
    boardsService = jasmine.createSpyObj<BoardsService>('BoardsService', ['getTaskDetails', 'updateCard']);
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

  // There is no attachments API or card creator in the data yet, so none of this may be invented.
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
