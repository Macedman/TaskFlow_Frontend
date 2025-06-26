import { Component, OnInit } from '@angular/core';
import { TaskcardComponent } from '../taskcard/taskcard.component';
import { ListType } from '../list/list.model';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-list',
  imports: [TaskcardComponent, CommonModule],
  templateUrl: './list.component.html',
  styleUrl: './list.component.css'
})
export class ListComponent implements OnInit {

  taskList: ListType = {
  todo: ['Get to work', 'Pick up groceries', 'Go home', 'Fall asleep'],
  doing: ['Backend', 'Frontend', 'Database', 'Play Dota'],
  done: ['Get up', 'Brush teeth', 'Take a shower', 'Check e-mail', 'Walk dog']
};

keys = Object.keys(this.taskList);

  ngOnInit() {
    //fetch data
    console.log(this.keys)
  }
}
