import {Directive, HostListener, Input} from '@angular/core';



@Directive({
	selector: '[cOnlyNumbersAllowed]'
})
export class OnlyNumbersAllowedDirective {
	@Input() active = true;

	constructor() {}

	@HostListener('keypress', ['$event'])
	onKeypress($event: any): any {
		if (this.active) {
			let charCode = $event.which || $event.keyCode || $event.charCode;
			if (charCode > 31 && (charCode < 48 || charCode > 57)) {
				return /^[0-9۰۱۲۳۴۵۶۷۸۹]$/.test($event.key);
			} else {
				return true;
			}
		}
	}
}
