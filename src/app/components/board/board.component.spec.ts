import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Dialog } from '@angular/cdk/dialog';
import { of, Subject, throwError } from 'rxjs';

import { BoardComponent } from './board.component';
import { BoardsService } from '../../services/boards.service';
import { BoardEvent, BoardEventsService } from '../../services/board-events.service';
import { ListType } from '../../models/list.model';
import { Card } from '../../models/card-details.model';
import { ShareBoardDialogComponent } from '../share-board-dialog/share-board-dialog.component';

describe('BoardComponent', () => {
  let component: BoardComponent;
  let fixture: ComponentFixture<BoardComponent>;
  let boardsService: jasmine.SpyObj<BoardsService>;
  let boardEvents: jasmine.SpyObj<BoardEventsService>;
  // stands in for the socket: next() means "someone else changed this board"
  let changedElsewhere: Subject<BoardEvent>;

  // To Do = a0, a1, a2 and Doing = b0, as the server returns them
  const serverLists = (): ListType[] => [
    { listId: '1', listName: 'To Do', cards: [
      { card_id: '10', card_title: 'a0' }, { card_id: '11', card_title: 'a1' }, { card_id: '12', card_title: 'a2' }
    ] },
    { listId: '2', listName: 'Doing', cards: [{ card_id: '20', card_title: 'b0' }] },
  ];

  beforeEach(async () => {
    boardsService = jasmine.createSpyObj<BoardsService>('BoardsService', ['getTasks', 'moveCard', 'getBoards']);
    boardsService.getTasks.and.callFake(() => of(serverLists()));
    boardsService.getBoards.and.returnValue(of([]));
    changedElsewhere = new Subject<BoardEvent>();
    boardEvents = jasmine.createSpyObj<BoardEventsService>('BoardEventsService', ['boardChanges']);
    boardEvents.boardChanges.and.returnValue(changedElsewhere);

    await TestBed.configureTestingModule({
      imports: [BoardComponent],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: BoardsService, useValue: boardsService },
        { provide: BoardEventsService, useValue: boardEvents },
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ boardId: '42' })) } },
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  const list = (name: string) => component.lists.find(l => l.listName === name)!;
  const titles = (name: string) => list(name).cards.map(c => c.card_title);
  // the same shape CDK passes: which arrays the card came from and went to, and where
  // (within one list CDK passes the same container object for both ends)
  const drop = (from: string, to: string, previousIndex: number, currentIndex: number) => {
    const previousContainer = { data: list(from).cards };
    const container = from === to ? previousContainer : { data: list(to).cards };
    component.onListDrop({ previousContainer, container, previousIndex, currentIndex } as unknown as CdkDragDrop<Card[]>);
  };
  const text = () => fixture.nativeElement.textContent as string;

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads the lists for the board in the route', () => {
    expect(boardsService.getTasks).toHaveBeenCalledOnceWith('42');
    expect(titles('To Do')).toEqual(['a0', 'a1', 'a2']);
  });

  it('reorders a card at once and saves its new place', () => {
    boardsService.moveCard.and.returnValue(of({ card_id: 10, list_id: 1, position: 2 }));

    drop('To Do', 'To Do', 0, 2);

    expect(titles('To Do')).toEqual(['a1', 'a2', 'a0']);
    expect(boardsService.moveCard).toHaveBeenCalledOnceWith('10', '1', 2);
  });

  it('moves a card to another list and saves it under that list', () => {
    boardsService.moveCard.and.returnValue(of({ card_id: 11, list_id: 2, position: 0 }));

    drop('To Do', 'Doing', 1, 0);

    expect(titles('To Do')).toEqual(['a0', 'a2']);
    expect(titles('Doing')).toEqual(['a1', 'b0']);
    expect(boardsService.moveCard).toHaveBeenCalledOnceWith('11', '2', 0);
  });

  it('sends nothing when a card is dropped back where it was', () => {
    drop('To Do', 'To Do', 1, 1);

    expect(boardsService.moveCard).not.toHaveBeenCalled();
  });

  it('reloads the board from the server and says so when saving fails', () => {
    boardsService.moveCard.and.returnValue(throwError(() => new Error('500')));

    drop('To Do', 'Doing', 0, 0);
    fixture.detectChanges();

    expect(boardsService.getTasks).toHaveBeenCalledTimes(2);
    expect(titles('To Do')).toEqual(['a0', 'a1', 'a2']);
    expect(titles('Doing')).toEqual(['b0']);
    expect(text()).toContain("Couldn't save the card's new position.");
  });

  it('clears that message after the next move saves', () => {
    boardsService.moveCard.and.returnValue(throwError(() => new Error('500')));
    drop('To Do', 'Doing', 0, 0);
    boardsService.moveCard.and.returnValue(of({ card_id: 10, list_id: 1, position: 1 }));

    drop('To Do', 'To Do', 0, 1);
    fixture.detectChanges();

    expect(text()).not.toContain("Couldn't save the card's new position.");
  });

  describe('live updates', () => {
    // pretend the server now has b0 first in To Do, so a reload is visible
    const serverMovedB0 = () => boardsService.getTasks.and.callFake(() => of([
      { listId: '1', listName: 'To Do', cards: [{ card_id: '20', card_title: 'b0' }] },
      { listId: '2', listName: 'Doing', cards: [] },
    ]));

    it('listens for changes to the board in the route', () => {
      expect(boardEvents.boardChanges).toHaveBeenCalledOnceWith('42');
    });

    it('reloads the board when it changes elsewhere', () => {
      serverMovedB0();

      changedElsewhere.next('changed');

      expect(boardsService.getTasks).toHaveBeenCalledTimes(2);
      expect(titles('To Do')).toEqual(['b0']);
    });

    it('waits until the drop when a change arrives mid-drag', () => {
      const placeholder = document.createElement('div');
      placeholder.className = 'cdk-drag-placeholder'; // what CDK shows while a card is dragged
      fixture.nativeElement.appendChild(placeholder);

      changedElsewhere.next('changed');
      expect(boardsService.getTasks).toHaveBeenCalledTimes(1);

      placeholder.remove();
      drop('To Do', 'To Do', 1, 1); // put back where it was
      expect(boardsService.getTasks).toHaveBeenCalledTimes(2);
    });

    it('waits for our own move to be saved before reloading', () => {
      const saving = new Subject<{ card_id: number; list_id: number; position: number }>();
      boardsService.moveCard.and.returnValue(saving);
      drop('To Do', 'To Do', 0, 2);

      changedElsewhere.next('changed');
      expect(boardsService.getTasks).toHaveBeenCalledTimes(1);

      saving.next({ card_id: 10, list_id: 1, position: 2 });
      saving.complete();
      expect(boardsService.getTasks).toHaveBeenCalledTimes(2);
    });

    it('applies only the newest reload when two overlap', () => {
      const first = new Subject<ListType[]>();
      const second = new Subject<ListType[]>();
      boardsService.getTasks.and.returnValues(first, second);

      changedElsewhere.next('changed');
      changedElsewhere.next('changed');
      second.next([{ listId: '1', listName: 'Newest', cards: [] }]);
      first.next([{ listId: '1', listName: 'Stale', cards: [] }]);

      expect(component.lists.map(l => l.listName)).toEqual(['Newest']);
    });

    it('stops listening when the board is closed', () => {
      expect(changedElsewhere.observed).toBeTrue();

      fixture.destroy();

      expect(changedElsewhere.observed).toBeFalse();
    });
  });

  describe('sharing', () => {
    it('opens the share dialog for this board', () => {
      const open = spyOn(TestBed.inject(Dialog), 'open');

      const share = [...fixture.nativeElement.querySelectorAll('button')]
        .find((b: HTMLButtonElement) => b.textContent?.trim() === 'Share') as HTMLButtonElement;
      share.click();

      expect(open).toHaveBeenCalledOnceWith(ShareBoardDialogComponent, { data: { boardId: '42' } });
    });

    it('closes any open dialog and goes to the dashboard when the owner removes us', () => {
      const closeAll = spyOn(TestBed.inject(Dialog), 'closeAll');
      const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);

      changedElsewhere.next('removed');

      expect(closeAll).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledOnceWith(['/dashboard'], { state: { notice: 'You were removed from that board.' } });
      expect(boardsService.getTasks).toHaveBeenCalledTimes(1); // no reload of a board we can't see
    });
  });
});
