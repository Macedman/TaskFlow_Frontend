import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { provideRouter } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';

import { DashboardComponent } from './dashboard.component';
import { CreateBoardDialogComponent } from '../create-board-dialog/create-board-dialog.component';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the navbar', () => {
    expect(fixture.nativeElement.querySelector('app-navbar nav')).not.toBeNull();
  });

  it('offers to create the first board when there are none', () => {
    const open = spyOn(TestBed.inject(Dialog), 'open');
    const button = [...fixture.nativeElement.querySelectorAll('button')]
      .find((b: HTMLButtonElement) => b.textContent?.trim() === 'Create your first board') as HTMLButtonElement;

    button.click();

    expect(open).toHaveBeenCalledOnceWith(CreateBoardDialogComponent);
  });

  it('shows no notice on a normal visit', () => {
    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeNull();
  });

  it('shows the notice passed with the navigation', () => {
    history.replaceState({ notice: 'You were removed from that board.' }, '');
    const withNotice = TestBed.createComponent(DashboardComponent);
    withNotice.detectChanges();
    history.replaceState(null, '');

    expect(withNotice.nativeElement.querySelector('[role="status"]')?.textContent).toContain('You were removed from that board.');
  });
});
