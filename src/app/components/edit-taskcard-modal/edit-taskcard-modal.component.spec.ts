import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditTaskcardModalComponent } from './edit-taskcard-modal.component';

describe('EditTaskcardModalComponent', () => {
  let component: EditTaskcardModalComponent;
  let fixture: ComponentFixture<EditTaskcardModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditTaskcardModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditTaskcardModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
