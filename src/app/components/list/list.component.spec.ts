import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ListComponent } from './list.component';
import { Card } from '../../models/card-details.model';

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
