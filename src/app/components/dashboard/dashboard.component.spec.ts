import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
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
