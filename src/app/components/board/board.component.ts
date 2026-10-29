import { Component, OnInit } from '@angular/core';
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

  onListDrop(event: CdkDragDrop<Card[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }
  }

  ngOnInit() {
  this.getTasks();
}

getTasks() {
  // fetch tasks
  //Add board id to the getTasks method in scho wanksfish is not en the boards service
  this.route.paramMap.subscribe(params => {
  const boardId = params.get('boardId');

  console.log('Board ID from route:', boardId);

  if (boardId) {
  this.boardService.getTasks(boardId).subscribe((response) => {
  this.lists = response;
  console.log('Fetched lists:', this.lists);
})
  }
});
  
}

}
