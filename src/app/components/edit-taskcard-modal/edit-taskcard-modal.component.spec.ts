import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { DatePipe } from '@angular/common';
import { of, throwError } from 'rxjs';

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
    boardsService = jasmine.createSpyObj<BoardsService>('BoardsService', ['getTaskDetails']);
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
