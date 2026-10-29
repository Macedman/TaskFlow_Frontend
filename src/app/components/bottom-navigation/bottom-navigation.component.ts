import { Component, HostListener, OnInit } from '@angular/core';
import { Icons } from '../../shared/icons';
import { LucideAngularModule } from 'lucide-angular';
import { BoardsService } from '../../services/boards.service';
import { Board } from '../../models/boards.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-bottom-navigation',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './bottom-navigation.component.html',
  styleUrl: './bottom-navigation.component.css'
})
export class BottomNavigationComponent implements OnInit {

  icons = Icons;
  boards: Board[] = [];
  searchTerm = '';
  isPickerOpen = false;
  isLoading = false;
  loadError = false;
  isListView = false;
  isPinned = false;
  activeScope: 'all' | 'workspace' = 'all';

  constructor(private boardsService: BoardsService, private router: Router) {}

  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.id) return;

    this.isLoading = true;
    this.boardsService.getBoards(user.id).subscribe({
      next: (boards) => {
        this.boards = boards || [];
        this.isLoading = false;
      },
      error: () => {
        this.loadError = true;
        this.isLoading = false;
      }
    });
  }

  get filteredBoards(): Board[] {
    const query = this.searchTerm.trim().toLowerCase();
    return this.boards.filter((board) => board.name?.toLowerCase().includes(query));
  }

  get recentBoards(): Board[] {
    return this.filteredBoards.slice(0, 4);
  }

  setScope(scope: 'all' | 'workspace'): void {
    this.activeScope = scope;
  }

  openPicker(): void {
    this.searchTerm = '';
    this.activeScope = 'all';
    this.isPickerOpen = true;
  }

  closePicker(): void {
    this.isPickerOpen = false;
  }

  openBoard(board: Board): void {
    this.closePicker();
    this.router.navigate(['/board', board.id]);
  }

  coverClass(index: number): string {
    return ['cover--sunset', 'cover--city', 'cover--blue', 'cover--pink'][index % 4];
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closePicker();
  }
}
