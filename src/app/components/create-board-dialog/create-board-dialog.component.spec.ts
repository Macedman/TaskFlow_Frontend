import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { DialogRef } from '@angular/cdk/dialog';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { CreateBoardDialogComponent } from './create-board-dialog.component';
import { BoardsService } from '../../services/boards.service';
import { Board } from '../../models/boards.model';

describe('CreateBoardDialogComponent', () => {
  let fixture: ComponentFixture<CreateBoardDialogComponent>;
  let boardsService: jasmine.SpyObj<BoardsService>;
  let dialogRef: jasmine.SpyObj<DialogRef>;
  let navigate: jasmine.Spy;

  beforeEach(async () => {
    boardsService = jasmine.createSpyObj<BoardsService>('BoardsService', ['createBoard']);
    dialogRef = jasmine.createSpyObj<DialogRef>('DialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [CreateBoardDialogComponent],
      providers: [
        provideRouter([]),
        { provide: BoardsService, useValue: boardsService },
        { provide: DialogRef, useValue: dialogRef },
      ]
    }).compileComponents();

    navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(CreateBoardDialogComponent);
    fixture.detectChanges();
  });

  const el = () => fixture.nativeElement as HTMLElement;
  const createButton = () => [...el().querySelectorAll<HTMLButtonElement>('button')].find(b => b.type === 'submit')!;
  const submitWith = (name: string) => {
    const input = el().querySelector<HTMLInputElement>('#board-name')!;
    input.value = name;
    input.dispatchEvent(new Event('input'));
    el().querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  };
  const httpError = (status: number) => throwError(() => new HttpErrorResponse({ status }));

  it('creates the board with a trimmed name, closes and opens it', () => {
    boardsService.createBoard.and.returnValue(of({ id: '5', name: 'Home' } as Board));

    submitWith('  Home  ');

    expect(boardsService.createBoard).toHaveBeenCalledOnceWith('Home');
    expect(dialogRef.close).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledOnceWith(['/board', '5']);
  });

  it('sends nothing for a blank name, and keeps Create disabled until there is one', () => {
    expect(createButton().disabled).toBeTrue();

    submitWith('   ');

    expect(boardsService.createBoard).not.toHaveBeenCalled();
    expect(createButton().disabled).toBeTrue();
  });

  it('asks for a valid name on a 400 and stays open', () => {
    boardsService.createBoard.and.returnValue(httpError(400));

    submitWith('Home');

    expect(el().textContent).toContain('Enter a board name (up to 255 characters).');
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('says to try again on any other error, and lets the user retry', () => {
    boardsService.createBoard.and.returnValue(httpError(500));

    submitWith('Home');

    expect(el().textContent).toContain("Couldn't create the board. Try again.");
    expect(createButton().disabled).toBeFalse();
  });

  it('closes from Cancel without creating anything', () => {
    [...el().querySelectorAll<HTMLButtonElement>('button')].find(b => b.textContent?.trim() === 'Cancel')!.click();

    expect(dialogRef.close).toHaveBeenCalledTimes(1);
    expect(boardsService.createBoard).not.toHaveBeenCalled();
  });
});
