import { Component, ElementRef, signal, viewChild, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-add-list',
  imports: [ReactiveFormsModule],
  templateUrl: './add-list.component.html',
  styleUrl: './add-list.component.css'
})
export class AddListComponent {
  isAdding = signal(false);

  newList = new FormControl('', Validators.required);
  //this textarea is conditionally rendered, used viewchild to make sure it is available for focus
  readonly textarea = viewChild<ElementRef<HTMLTextAreaElement>>('myTextArea');

  constructor() {}


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

