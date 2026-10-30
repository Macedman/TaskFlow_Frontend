import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { AddListComponent } from './add-list.component';
import { ListType } from '../../models/list.model';
import { environment } from '../../../environments/environment';

describe('AddListComponent', () => {
  let component: AddListComponent;
  let fixture: ComponentFixture<AddListComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddListComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddListComponent);
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

  it('does not send a request when the name is blank', () => {
    component.boardId = '42';
    component.newList.setValue('   ');

    component.confirmAddList();

    httpMock.expectNone(`${environment.apiUrl}/api/addList`);
  });

  it('emits the created list, then resets and closes the form', () => {
    const created: ListType = { listId: '7', listName: 'Todo', cards: [] };
    let emitted: ListType | undefined;
    component.listAdded.subscribe(list => (emitted = list));
    component.boardId = '42';
    component.isAdding.set(true);
    component.newList.setValue('  Todo  ');

    component.confirmAddList();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/addList`);
    expect(req.request.body).toEqual({ boardId: '42', name: 'Todo' });
    req.flush(created);

    expect(emitted).toEqual(created);
    expect(component.newList.value).toBeNull();
    expect(component.isAdding()).toBeFalse();
  });
});
