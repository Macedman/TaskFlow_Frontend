import { Component } from '@angular/core';
import { BoardsService } from '../../services/boards.service';
import { Board } from '../../models/boards.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  boards: Board[] = [];
  user = JSON.parse(localStorage.getItem('user') || '{}'); //transfer this to a service
  userName = this.user.full_name;
  //a one-off message passed with the navigation (router state), e.g. after being removed from a board.
  //it isn't in the URL, so a refresh or a bookmark won't show it again
  notice: string | null = typeof history.state?.notice === 'string' ? history.state.notice : null;


  constructor(private boardService: BoardsService,
              private router: Router
  ) {}


  ngOnInit() {
    this.getBoards();
  }

  
//Transfer this to dashboard component, this is not the right place to get boards
getBoards() {
  this.boardService.getBoards().subscribe((response) => {
    this.boards = response;
  });
}

click (board: Board) {
  //go to board page
  //Add a route to the board page and pass the board id as a 
  this.router.navigate(['/board', board.id]);
}

}
