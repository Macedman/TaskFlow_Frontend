import { Component, OnInit, signal } from '@angular/core';
import { ListComponent } from '../list/list.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ListType } from '../../models/list.model';
import { CdkDragDrop, CdkDropListGroup, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { AddListComponent } from '../add-list/add-list.component';
import { BoardsService } from '../../services/boards.service';
import { BottomNavigationComponent } from '../bottom-navigation/bottom-navigation.component';
import { Board } from '../../models/boards.model';
import { ActivatedRoute } from '@angular/router';
import { Card } from '../../models/card-details.model';

@Component({
  selector: 'app-board',
  imports: [ListComponent, NavbarComponent, AddListComponent, CdkDropListGroup, BottomNavigationComponent],
  templateUrl: './board.component.html',
  styleUrl: './board.component.css'
})
export class BoardComponent implements OnInit {
  constructor(private boardService: BoardsService,
              private route: ActivatedRoute
  ) {}

  lists: ListType[] = [];
  boardId: string = '';
  moveError = signal(false);

  onListDrop(event: CdkDragDrop<Card[]>) {
    if (event.previousContainer === event.container) {
      if (event.previousIndex === event.currentIndex) return; //dropped back where it was
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
    if (!card || !targetList) return;

    this.boardService.moveCard(card.card_id, targetList.listId, event.currentIndex).subscribe({
      next: () => this.moveError.set(false),
      //the server's order is the truth: reload it rather than trying to undo the move by hand
      error: () => {
        this.moveError.set(true);
        this.loadLists();
      }
    });
  }

  loadLists() {
    this.boardService.getTasks(this.boardId).subscribe((response) => {
      this.lists = response;
    });
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
  }
});

}

  //new array reference so the @for re-renders with the created list at the end
  onListAdded(list: ListType) {
    this.lists = [...this.lists, list];
  }

}
