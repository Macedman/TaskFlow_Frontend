import { Component } from '@angular/core';
import { ListComponent } from '../list/list.component';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-board',
  imports: [ListComponent, NavbarComponent],
  templateUrl: './board.component.html',
  styleUrl: './board.component.css'
})
export class BoardComponent {

}
