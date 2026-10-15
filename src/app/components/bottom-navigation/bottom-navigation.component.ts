import { Component } from '@angular/core';
import { Icons } from '../../shared/icons';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-bottom-navigation',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './bottom-navigation.component.html',
  styleUrl: './bottom-navigation.component.css'
})
export class BottomNavigationComponent {

  icons = Icons;
}
