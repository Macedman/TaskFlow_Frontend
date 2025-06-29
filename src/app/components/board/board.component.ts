import { Component, OnInit } from '@angular/core';
import { ListComponent } from '../list/list.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ListType } from '../list/list.model';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { AddListComponent } from '../add-list/add-list.component';

@Component({
  selector: 'app-board',
  imports: [ListComponent, NavbarComponent, SidebarComponent, AddListComponent],
  templateUrl: './board.component.html',
  styleUrl: './board.component.css'
})
export class BoardComponent implements OnInit {

    taskList: ListType = {
    todo: ['Get to work', 'Pick up groceries', 'Go home', 'Fall asleep'],
    doing: ['Backend', 'Frontend', 'Database', 'Play Dota'],
    done: ['Get up', 'Brush teeth', 'Take a shower', 'Check e-mail', 'Walk dog']
  };

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
  this.keys = Object.keys(this.taskList);
}

}
