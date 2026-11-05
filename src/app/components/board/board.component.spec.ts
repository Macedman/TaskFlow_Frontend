import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { of, throwError } from 'rxjs';

import { BoardComponent } from './board.component';
import { BoardsService } from '../../services/boards.service';
import { ListType } from '../../models/list.model';
import { Card } from '../../models/card-details.model';

describe('BoardComponent', () => {
  let component: BoardComponent;
  let fixture: ComponentFixture<BoardComponent>;
  let boardsService: jasmine.SpyObj<BoardsService>;

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

    await TestBed.configureTestingModule({
      imports: [BoardComponent],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: BoardsService, useValue: boardsService },
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
});
