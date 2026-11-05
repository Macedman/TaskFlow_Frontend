import { Component, ElementRef, OnDestroy, OnInit, signal } from '@angular/core';
import { ListComponent } from '../list/list.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ListType } from '../../models/list.model';
import { CdkDragDrop, CdkDropListGroup, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { AddListComponent } from '../add-list/add-list.component';
import { BoardsService } from '../../services/boards.service';
import { BoardEventsService } from '../../services/board-events.service';
import { BottomNavigationComponent } from '../bottom-navigation/bottom-navigation.component';
import { Board } from '../../models/boards.model';
import { ActivatedRoute } from '@angular/router';
import { Card } from '../../models/card-details.model';
import { catchError, EMPTY, Subject, Subscription, switchMap } from 'rxjs';

@Component({
  selector: 'app-board',
  imports: [ListComponent, NavbarComponent, AddListComponent, CdkDropListGroup, BottomNavigationComponent],
  templateUrl: './board.component.html',
  styleUrl: './board.component.css'
})
export class BoardComponent implements OnInit, OnDestroy {
  constructor(private boardService: BoardsService,
              private route: ActivatedRoute,
              private boardEvents: BoardEventsService,
              private host: ElementRef<HTMLElement>
  ) {}

  lists: ListType[] = [];
  boardId: string = '';
  moveError = signal(false);

  //switchMap drops an older reload still in flight, so a slow response can't overwrite a newer one
  private reloads = new Subject<void>();
  private reloadSubscription = this.reloads.pipe(
    switchMap(() => this.boardService.getTasks(this.boardId).pipe(catchError(() => EMPTY)))
  ).subscribe((response) => {
    this.lists = response;
  });
  private boardChanges?: Subscription;
  //moves sent but not answered yet, and whether a change from elsewhere is waiting for them
  private savingMoves = 0;
  private reloadPending = false;

  onListDrop(event: CdkDragDrop<Card[]>) {
    if (event.previousContainer === event.container) {
      if (event.previousIndex === event.currentIndex) return this.reloadIfPending(); //dropped back where it was
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }

    //the card is already shown in its new place; now save it
    const card = event.container.data[event.currentIndex];
    const targetList = this.lists.find(list => list.cards === event.container.data);
    if (!card || !targetList) return this.reloadIfPending();

    this.savingMoves++;
    this.boardService.moveCard(card.card_id, targetList.listId, event.currentIndex).subscribe({
      next: () => {
        this.savingMoves--;
        this.moveError.set(false);
        this.reloadIfPending();
      },
      //the server's order is the truth: reload it rather than trying to undo the move by hand
      error: () => {
        this.savingMoves--;
        this.moveError.set(true);
        this.reloadPending = false;
        this.loadLists();
      }
    });
  }

  loadLists() {
    this.reloads.next();
  }

  //Someone else changed the board. Reloading mid-drag would swap the lists out from under the drag,
  //and reloading before our own move is saved could fetch the old order, so wait for both
  private onBoardChangedElsewhere() {
    if (this.isDragging() || this.savingMoves > 0) {
      this.reloadPending = true;
      return;
    }
    this.loadLists();
  }

  private reloadIfPending() {
    if (this.reloadPending && this.savingMoves === 0) {
      this.reloadPending = false;
      this.loadLists();
    }
  }

  //CDK keeps a placeholder in the list for as long as a card is being dragged
  private isDragging() {
    return !!this.host.nativeElement.querySelector('.cdk-drag-placeholder');
  }

  ngOnInit() {
  this.getTasks();
}

getTasks() {
  // fetch tasks
  //Add board id to the getTasks method in scho wanksfish is not en the boards service
  this.route.paramMap.subscribe(params => {
  const boardId = params.get('boardId');


  if (boardId) {
  this.boardId = boardId;
  this.loadLists();
  //listen for changes to this board only; moving to another board leaves the old one
  this.boardChanges?.unsubscribe();
  this.boardChanges = this.boardEvents.boardChanges(boardId).subscribe(() => this.onBoardChangedElsewhere());
  }
});

}

  ngOnDestroy() {
    this.boardChanges?.unsubscribe();
    this.reloadSubscription.unsubscribe();
  }

  //new array reference so the @for re-renders with the created list at the end
  onListAdded(list: ListType) {
    this.lists = [...this.lists, list];
  }

}
