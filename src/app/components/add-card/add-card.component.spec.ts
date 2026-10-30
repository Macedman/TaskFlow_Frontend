import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { AddCardComponent } from './add-card.component';
import { NewCardResponse } from '../../models/card-details.model';
import { environment } from '../../../environments/environment';

describe('AddCardComponent', () => {
  let component: AddCardComponent;
  let fixture: ComponentFixture<AddCardComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddCardComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddCardComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not send a request and stays open when the title is blank', () => {
    component.listId = '7';
    component.isAddingCard.set(true);
    component.newCard.setValue('   ');

    component.confirmAddCard();

    httpMock.expectNone(`${environment.apiUrl}/api/addTask`);
    expect(component.isAddingCard()).toBeTrue();
  });

  it('emits the created card, then resets and closes the form', () => {
    const created: NewCardResponse = {
      id: '9', list_id: '7', title: 'Buy milk', description: '',
      position: 0, due_date: null, created_at: '2026-10-30T00:00:00.000Z'
    };
    let emitted: NewCardResponse | undefined;
    component.cardAdded.subscribe(card => (emitted = card));
    component.listId = '7';
    component.isAddingCard.set(true);
    component.newCard.setValue('  Buy milk  ');

    component.confirmAddCard();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/addTask`);
    expect(req.request.body).toEqual({ listId: '7', title: 'Buy milk' });
    req.flush(created);

    expect(emitted).toEqual(created);
    expect(component.newCard.value).toBeNull();
    expect(component.isAddingCard()).toBeFalse();
  });

  it('keeps the form open with the typed title when the request fails', () => {
    component.listId = '7';
    component.isAddingCard.set(true);
    component.newCard.setValue('Buy milk');

    component.confirmAddCard();

    httpMock.expectOne(`${environment.apiUrl}/api/addTask`)
      .flush({ message: 'List not found' }, { status: 404, statusText: 'Not Found' });

    expect(component.isAddingCard()).toBeTrue();
    expect(component.newCard.value).toBe('Buy milk');
  });
});
