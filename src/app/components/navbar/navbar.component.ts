import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { LucideAngularModule } from 'lucide-angular';
import { Icons } from '../../shared/icons';
import { AuthService } from '../../services/auth.service';
import { CreateBoardDialogComponent } from '../create-board-dialog/create-board-dialog.component';

// Only things that work today; add an item when its feature exists, not before
@Component({
  selector: 'app-navbar',
  // the CDK menu gives the account menu keyboard support (arrows, Escape), closing on an
  // outside click and the right ARIA roles, none of which a hand-made dropdown would have
  imports: [RouterLink, RouterLinkActive, CdkMenuTrigger, CdkMenu, CdkMenuItem, LucideAngularModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  private dialog = inject(Dialog);
  private authService = inject(AuthService);

  icons = Icons;
  private user: { full_name?: string; email?: string } = JSON.parse(localStorage.getItem('user') || '{}');
  fullName = this.user.full_name?.trim() || '';
  email = this.user.email || '';
  firstName = this.fullName.split(/\s+/)[0] || this.email;
  // "Sam Smith" -> "SS"; a one-word name or no name falls back to its (or the email's) first letter
  initials = (this.fullName.split(/\s+/).filter(Boolean).map(word => word[0]).slice(0, 2).join('')
    || this.email.charAt(0)).toUpperCase();

  openCreateBoard() {
    this.dialog.open(CreateBoardDialogComponent);
  }

  logout() {
    this.authService.logout();
  }
}
