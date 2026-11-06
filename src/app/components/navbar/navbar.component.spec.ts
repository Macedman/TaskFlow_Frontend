import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';

import { NavbarComponent } from './navbar.component';
import { AuthService } from '../../services/auth.service';
import { CreateBoardDialogComponent } from '../create-board-dialog/create-board-dialog.component';

describe('NavbarComponent', () => {
  let fixture: ComponentFixture<NavbarComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let dialog: jasmine.SpyObj<Dialog>;

  const create = async (user: object) => {
    localStorage.setItem('user', JSON.stringify(user));
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['logout']);
    dialog = jasmine.createSpyObj<Dialog>('Dialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
        { provide: Dialog, useValue: dialog },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();
  };

  afterEach(() => localStorage.removeItem('user'));

  const el = () => fixture.nativeElement as HTMLElement;
  const accountButton = () => el().querySelector<HTMLButtonElement>('button[aria-label="Account"]')!;
  // the menu opens in an overlay at the end of <body>, outside the component
  const openMenu = () => {
    accountButton().click();
    fixture.detectChanges();
    return document.querySelector<HTMLElement>('[role="menu"]')!;
  };

  it('links the logo and Boards to the dashboard', async () => {
    await create({ id: 1, full_name: 'Sam Smith', email: 'sam@example.com' });

    const links = [...el().querySelectorAll('a')].map(a => [a.textContent?.trim(), a.getAttribute('href')]);
    expect(links).toEqual([['Taskflow', '/dashboard'], ['Boards', '/dashboard']]);
  });

  it("shows the user's initials and first name", async () => {
    await create({ id: 1, full_name: 'Sam  Smith', email: 'sam@example.com' });

    expect(accountButton().textContent).toContain('SS');
    expect(accountButton().textContent).toContain('Sam');
  });

  it('falls back to the email when there is no name', async () => {
    await create({ id: 1, email: 'kim@example.com' });

    expect(accountButton().textContent).toContain('K');
    expect(accountButton().textContent).toContain('kim@example.com');
  });

  it('opens an account menu with the full name, email and Log out', async () => {
    await create({ id: 1, full_name: 'Sam Smith', email: 'sam@example.com' });

    const menu = openMenu();

    expect(menu.textContent).toContain('Sam Smith');
    expect(menu.textContent).toContain('sam@example.com');
    expect(menu.querySelector('[role="menuitem"]')?.textContent).toContain('Log out');
  });

  it('logs out from the menu', async () => {
    await create({ id: 1, full_name: 'Sam Smith', email: 'sam@example.com' });

    openMenu().querySelector<HTMLButtonElement>('[role="menuitem"]')!.click();

    expect(authService.logout).toHaveBeenCalledTimes(1);
  });

  it('opens the create-board dialog', async () => {
    await create({ id: 1, full_name: 'Sam Smith', email: 'sam@example.com' });

    el().querySelector<HTMLButtonElement>('button[aria-label="Create board"]')!.click();

    expect(dialog.open).toHaveBeenCalledOnceWith(CreateBoardDialogComponent);
  });
});
