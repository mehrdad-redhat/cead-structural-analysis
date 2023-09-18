import {
	Directive,
	EventEmitter,
	HostListener,
	Input,
	Output,
} from '@angular/core';

@Directive({
	selector: '[cCloseWithOutsideClick]'
})
export class CloseByOutsideClickDirective {
	@Input('clickTarget') target!: Element;
	
	@Output('outsideClicked') outside = new EventEmitter<boolean>();
	
	constructor() {}

	@HostListener('window:click', ['$event'])
	onClick(ev) {
		if (this.isOutside(ev, this.target)) {
			this.outside.emit(true);
		}
	}

	isOutside(ev, el): boolean {
		return !ev.composedPath().includes(el);
	}
}
