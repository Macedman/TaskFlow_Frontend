import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { of, throwError } from 'rxjs';

import { ShareBoardDialogComponent } from './share-board-dialog.component';
import { BoardsService } from '../../services/boards.service';
import { BoardMember } from '../../models/boards.model';

describe('ShareBoardDialogComponent', () => {
  let fixture: ComponentFixture<ShareBoardDialogComponent>;
  let boardsService: jasmine.SpyObj<BoardsService>;
  let dialogRef: jasmine.SpyObj<DialogRef>;

  const owner: BoardMember = { user_id: 1, full_name: 'Olive Owner', email: 'olive@example.com', role: 'owner' };
  const member: BoardMember = { user_id: 2, full_name: 'Mo Member', email: 'mo@example.com', role: 'member' };
  const ann: BoardMember = { user_id: 3, full_name: 'Ann New', email: 'ann@example.com', role: 'member' };

  // logs in as `me`, then opens the dialog for board 42
  const open = async (me: BoardMember) => {
    localStorage.setItem('user', JSON.stringify({ id: me.user_id }));
    boardsService = jasmine.createSpyObj<BoardsService>('BoardsService', ['getBoardMembers', 'addBoardMember', 'removeBoardMember']);
    boardsService.getBoardMembers.and.returnValue(of([owner, member]));
    dialogRef = jasmine.createSpyObj<DialogRef>('DialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [ShareBoardDialogComponent],
      providers: [
        { provide: BoardsService, useValue: boardsService },
        { provide: DialogRef, useValue: dialogRef },
        { provide: DIALOG_DATA, useValue: { boardId: '42' } },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ShareBoardDialogComponent);
    fixture.detectChanges();
  };

  afterEach(() => localStorage.removeItem('user'));

  const el = () => fixture.nativeElement as HTMLElement;
  const text = () => el().textContent as string;
  const emailInput = () => el().querySelector<HTMLInputElement>('#invite-email');
  const removeButtons = () => [...el().querySelectorAll<HTMLButtonElement>('button')].filter(b => b.textContent?.trim() === 'Remove');
  const inviteAs = (email: string) => {
    const input = emailInput()!;
    input.value = email;
    input.dispatchEvent(new Event('input'));
    el().querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  };
  const httpError = (status: number, message?: string) =>
    throwError(() => new HttpErrorResponse({ status, error: message ? { message } : null }));

  it('lists everyone on the board, the owner marked', async () => {
    await open(member);

    expect(boardsService.getBoardMembers).toHaveBeenCalledOnceWith('42');
    expect(text()).toContain('Olive Owner');
    expect(text()).toContain('mo@example.com');
    expect(text()).toContain('Owner');
  });

  it('shows a member the list only: no invite form and no remove buttons', async () => {
    await open(member);

    expect(emailInput()).toBeNull();
    expect(removeButtons().length).toBe(0);
    expect(text()).toContain('Only the board owner can invite or remove people.');
  });

  it('lets the owner invite someone and adds them to the list', async () => {
    await open(owner);
    boardsService.addBoardMember.and.returnValue(of(ann));

    inviteAs('  ann@example.com ');

    expect(boardsService.addBoardMember).toHaveBeenCalledOnceWith('42', 'ann@example.com');
    expect(text()).toContain('Ann New');
    expect(emailInput()!.value).toBe('');
  });

  it('sends nothing for an empty email', async () => {
    await open(owner);

    inviteAs('   ');

    expect(boardsService.addBoardMember).not.toHaveBeenCalled();
  });

  it("shows the server's reason when no account has that email", async () => {
    await open(owner);
    boardsService.addBoardMember.and.returnValue(httpError(404, 'No account with that email'));

    inviteAs('nobody@example.com');

    expect(text()).toContain('No account with that email');
    expect(emailInput()!.value).toBe('nobody@example.com'); // kept so it can be fixed
  });

  it("shows the server's reason for someone already on the board and for too many tries", async () => {
    await open(owner);
    boardsService.addBoardMember.and.returnValue(httpError(409, 'That person is already on this board'));
    inviteAs('mo@example.com');
    expect(text()).toContain('That person is already on this board');

    boardsService.addBoardMember.and.returnValue(httpError(429, 'Too many failed invites. Try again later.'));
    inviteAs('x@example.com');
    expect(text()).toContain('Too many failed invites.');
  });

  it('asks for a valid address on a 400 and says to try again on anything else', async () => {
    await open(owner);
    boardsService.addBoardMember.and.returnValue(httpError(400, 'boardId and a valid email are required'));
    inviteAs('not-an-email');
    expect(text()).toContain('Enter a valid email address.');

    boardsService.addBoardMember.and.returnValue(httpError(500));
    inviteAs('ann@example.com');
    expect(text()).toContain("Couldn't invite that person. Try again.");
  });

  it('lets the owner remove a member after confirming, but not the owner', async () => {
    await open(owner);
    spyOn(window, 'confirm').and.returnValue(true);
    boardsService.removeBoardMember.and.returnValue(of({ user_id: 2 }));

    expect(removeButtons().length).toBe(1); // only Mo has one
    removeButtons()[0].click();
    fixture.detectChanges();

    expect(boardsService.removeBoardMember).toHaveBeenCalledOnceWith('42', 2);
    expect(text()).not.toContain('Mo Member');
  });

  it('keeps the member when the owner cancels', async () => {
    await open(owner);
    spyOn(window, 'confirm').and.returnValue(false);

    removeButtons()[0].click();

    expect(boardsService.removeBoardMember).not.toHaveBeenCalled();
  });

  it('says so when removing fails, and keeps the member listed', async () => {
    await open(owner);
    spyOn(window, 'confirm').and.returnValue(true);
    boardsService.removeBoardMember.and.returnValue(httpError(500));

    removeButtons()[0].click();
    fixture.detectChanges();

    expect(text()).toContain("Couldn't remove this person.");
    expect(text()).toContain('Mo Member');
  });

  it("says so when the list can't be loaded", async () => {
    localStorage.setItem('user', JSON.stringify({ id: 1 }));
    await open(owner);
    boardsService.getBoardMembers.and.returnValue(httpError(500));
    fixture = TestBed.createComponent(ShareBoardDialogComponent);
    fixture.detectChanges();

    expect(text()).toContain("Couldn't load who's on this board.");
  });

  it('closes from the X button', async () => {
    await open(member);

    el().querySelector<HTMLButtonElement>('button[aria-label="Close"]')!.click();

    expect(dialogRef.close).toHaveBeenCalledTimes(1);
  });
});
