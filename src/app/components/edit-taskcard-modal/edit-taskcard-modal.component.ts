import { Component } from '@angular/core';
import { BoardsService } from '../../services/boards.service';
import { OnInit } from '@angular/core';

@Component({
  selector: 'app-edit-taskcard-modal',
  imports: [],
  templateUrl: './edit-taskcard-modal.component.html',
  styleUrl: './edit-taskcard-modal.component.css'
})
export class EditTaskcardModalComponent implements OnInit {
  cardId: string = '';
  
  constructor(private boardsService: BoardsService) { }

  title : string = 'Set up Angular and Backend, Auth Systems';


  ngOnInit() {
    this.cardId = '1'; // Example cardId, replace with actual value as needed
    this.boardsService.getTaskDetails('1').subscribe((response) => {
      console.log('Task Details:', response);
    })
  }
}
