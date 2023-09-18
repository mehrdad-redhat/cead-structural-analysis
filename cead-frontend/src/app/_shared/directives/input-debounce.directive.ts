import {
  Directive,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
import {NgModel} from '@angular/forms';
import {Subscription} from 'rxjs/internal/Subscription';
import {debounceTime, distinctUntilChanged} from 'rxjs/operators';

@Directive({
  selector: '[NgModelDebounced]',
})
export class NgModelDebounced implements OnDestroy, OnChanges {
  @Output()
  NgModelDebounced = new EventEmitter<any>();
  /**
   * Key to know if change is due to index changes or value change
   */
  @Input('NgModelChangeKey') key: any;

  indexChange: boolean = false;

  /**
   * Debounce Time in millisecond
   */
  ngModelChangeDebounceTime: number = 400;

  subscription: Subscription;

  constructor(private ngModel: NgModel) {
    this.subscription = this.ngModel.control.valueChanges.pipe(
        distinctUntilChanged(),
        debounceTime(this.ngModelChangeDebounceTime),
    ).subscribe((value) => {
      if (!this.indexChange) {
        this.NgModelDebounced.emit(value);
      }
      this.indexChange = false;
    });
  }

  ngOnDestroy() {
    if (this.subscription)
      this.subscription.unsubscribe();
  }

// Methods
  ngOnChanges(changes: SimpleChanges) {
    if (changes.key && changes.key.currentValue !== undefined) {
      this.indexChange = true;
    }
  }
}
