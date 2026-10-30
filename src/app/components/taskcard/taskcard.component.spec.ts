import { EventEmitter } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Dialog } from '@angular/cdk/dialog';
import { of } from 'rxjs';

import { TaskcardComponent } from './taskcard.component';
import { EditTaskcardModalComponent } from '../edit-taskcard-modal/edit-taskcard-modal.component';

describe('TaskcardComponent', () => {
  let component: TaskcardComponent;
  let fixture: ComponentFixture<TaskcardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskcardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaskcardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the new title when the card is renamed in the modal', () => {
    const titleChanged = new EventEmitter<string>();
    spyOn(TestBed.inject(Dialog), 'open').and.returnValue(
      { closed: of(undefined), componentInstance: { titleChanged } } as any
    );
    component.card = { card_id: '9', card_title: 'Buy milk' };
    component.openDialog();

    titleChanged.emit('Buy oat milk');
    fixture.detectChanges();

    expect(component.card.card_title).toBe('Buy oat milk');
    expect(fixture.nativeElement.textContent).toContain('Buy oat milk');
  });

  it('openDialog passes the clicked card id to the modal', () => {
    const open = spyOn(TestBed.inject(Dialog), 'open').and.returnValue({ closed: of(undefined) } as any);
    component.card = { card_id: '9', card_title: 'Buy milk' };

    component.openDialog();

    expect(open).toHaveBeenCalledWith(
      EditTaskcardModalComponent,
      jasmine.objectContaining({ data: { cardId: '9' } })
    );
  });
});
