import { Component, ElementRef, signal, viewChild, OnInit, HostListener, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-add-list',
  imports: [ReactiveFormsModule],
  templateUrl: './add-list.component.html',
  styleUrl: './add-list.component.css'
})
export class AddListComponent implements OnInit {
  isAdding = signal(false);

  newList = new FormControl('', Validators.required);
  //this textarea is conditionally rendered, used viewchild to make sure it is available for focus
  //the purpose of this viewchild is to get the textarea element and focus on it when Add list button is clicked
  readonly textarea = viewChild<ElementRef<HTMLTextAreaElement>>('myTextArea');
  readonly myAddListDiv = viewChild<ElementRef<HTMLDivElement>>('myAddListDiv');

  constructor() {}

  ngOnInit(): void {
    
  }

  //listen to outside click
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const clickedInside = this.myAddListDiv()?.nativeElement.contains(event.target as Node);
    if (!clickedInside) {
      this.isAdding.set(false);
    }
  }

    //listen for ESC click
  @HostListener('document:keydown.escape', ['$event'])
  onEscapePress(event: KeyboardEvent) {
    this.isAdding.set(false);
  }


  addList() {
    //set to true to enable input text
    this.isAdding.set(true);
    //focus on input text
    setTimeout(() => {
      if (this.textarea()) {
        this.textarea()?.nativeElement.focus();
      }
    })
  }

  cancelAddList() {
    this.isAdding.set(false);
    this.newList.reset();
  }

  confirmAddList() {
    //if form is invalid, dont sent the payload
    if (this.newList.invalid) return;
    console.log(this.newList.value);

    //send the payload to store new list in DB
  }
}

