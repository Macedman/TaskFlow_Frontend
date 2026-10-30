import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { ListComponent } from './list.component';
import { Card } from '../../models/card-details.model';
import { environment } from '../../../environments/environment';

describe('ListComponent', () => {
  let component: ListComponent;
  let fixture: ComponentFixture<ListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListComponent],
      // the template renders AddCardComponent, which injects BoardsService -> HttpClient
      providers: [provideHttpClient(), provideHttpClientTesting()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('editing the title', () => {
    const url = `${environment.apiUrl}/api/updateList`;
    let httpMock: HttpTestingController;

    const startEditingAs = (name: string) => {
      component.startEditingTitle();
      component.titleControl.setValue(name);
    };

    beforeEach(() => {
      httpMock = TestBed.inject(HttpTestingController);
      component.listId = '7';
      component.listTitle = 'Todo';
    });

    afterEach(() => httpMock.verify());

    it('starts with the current title in the input', () => {
      component.startEditingTitle();

      expect(component.isEditingTitle()).toBeTrue();
      expect(component.titleControl.value).toBe('Todo');
    });

    it('saves the trimmed title and shows it right away', () => {
      startEditingAs('  Doing  ');
      component.saveTitle();

      expect(component.isEditingTitle()).toBeFalse();
      expect(component.listTitle).toBe('Doing');

      const req = httpMock.expectOne(url);
      expect(req.request.body).toEqual({ listId: '7', name: 'Doing' });
      req.flush({ listId: '7', listName: 'Doing' });
      expect(component.listTitle).toBe('Doing');
    });

    it('sends one request when Enter is followed by the input losing focus', () => {
      startEditingAs('Doing');
      component.saveTitle();
      component.saveTitle();

      httpMock.expectOne(url).flush({ listId: '7', listName: 'Doing' });
    });

    it('does not send a request for a blank or unchanged title', () => {
      startEditingAs('   ');
      component.saveTitle();
      expect(component.listTitle).toBe('Todo');
      expect(component.isEditingTitle()).toBeFalse();

      startEditingAs('Todo');
      component.saveTitle();

      httpMock.expectNone(url);
    });

    it('does not save after cancelling, even when the input then loses focus', () => {
      startEditingAs('Doing');
      component.cancelEditingTitle();
      component.saveTitle();

      expect(component.isEditingTitle()).toBeFalse();
      expect(component.listTitle).toBe('Todo');
      httpMock.expectNone(url);
    });

    it('puts the old title back and reports it when the save fails', () => {
      startEditingAs('Doing');
      component.saveTitle();

      httpMock.expectOne(url).flush({ message: 'List not found' }, { status: 404, statusText: 'Not Found' });

      expect(component.listTitle).toBe('Todo');
      expect(component.titleError()).toBeTrue();
    });
  });

  // cards is the same array the board and cdkDropList hold, so it must be updated in place
  it('pushes the created card, mapped to the board shape, into the same cards array', () => {
    const cards: Card[] = [{ card_id: '1', card_title: 'Existing' }];
    component.cards = cards;

    component.onCardAdded({
      id: '9', list_id: '7', title: 'Buy milk', description: '',
      position: 1, due_date: null, created_at: '2026-10-30T00:00:00.000Z'
    });

    expect(component.cards).toBe(cards);
    expect(cards).toEqual([
      { card_id: '1', card_title: 'Existing' },
      { card_id: '9', card_title: 'Buy milk' }
    ]);
  });
});
