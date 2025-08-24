import { Component, OnInit } from '@angular/core';
import { ListComponent } from '../list/list.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ListType } from '../../models/list.model';
import { CdkDragDrop, CdkDropListGroup, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { AddListComponent } from '../add-list/add-list.component';
import { BoardsService } from '../../services/boards.service';

@Component({
  selector: 'app-board',
  imports: [ListComponent, NavbarComponent, SidebarComponent, AddListComponent, CdkDropListGroup],
  templateUrl: './board.component.html',
  styleUrl: './board.component.css'
})
export class BoardComponent implements OnInit {
  constructor(private boardService: BoardsService) {}

  taskList: ListType = {};
  keys: string[] = [];
  connectedTo: string[] = [];

  public getConnectedTo(key: string): string[] {
    return this.keys.filter(k => k !== key);
  }

  onListDrop(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      console.log(event.previousContainer, event.container);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
      console.log(event);
    }
  }

  ngOnInit() {
  // pass the userId as parameters for fetching tasks
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user.id;

  // fetch tasks
  this.boardService.getTasks(userId).subscribe((response) => {
  this.keys = Object.keys(response);
  this.taskList = response;
  console.log('Task List:', this.taskList);
})
}

}
