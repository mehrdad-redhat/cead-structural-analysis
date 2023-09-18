import {AfterViewChecked, Directive, ElementRef, Input} from '@angular/core';
import {Tools} from '../../core/utils';

@Directive({
	selector: '[cFixedSize]',
})
export class FixedSizeDirective implements AfterViewChecked {
	@Input('cFixedSizeAxis')
	fixedSizeAxis: string = AXIS.HORIZONTAL;

	@Input('expanded')
	expanded: boolean = false;

	@Input('totalMargin')
	margin: number = 0;

	constructor(private el: ElementRef) {
	}

// Methods
	ngAfterViewChecked() {
		if (this.fixedSizeAxis == AXIS.HORIZONTAL || this.fixedSizeAxis == '') {
			let initialWidth = this.el.nativeElement.offsetWidth;
			Tools.changeViewChildStyle(
					this.el.nativeElement,
					'max-width',
					`${initialWidth}px`,
			);
		} else if (this.fixedSizeAxis == AXIS.VERTICAL) {
			if (this.expanded) {
				this.doExpand(AXIS.VERTICAL);
			} else {
				let initialHeight = this.el.nativeElement.offsetHeight;
				Tools.changeViewChildStyle(
						this.el.nativeElement,
						'max-height',
						`${initialHeight}px`,
				);
			}
		}
	}

	doExpand(axis: string) {
		if (axis == AXIS.VERTICAL) {
			let parent = this.el.nativeElement.parentElement;
			let family = Array.from(parent.children);
			let takenLength = 0;
			family.forEach((child: ElementRef) => {
				
				if (child != this.el.nativeElement) {
					takenLength += child['offsetHeight'];
				}
			});
			takenLength += this.margin;
			let totalLength = parent.offsetHeight;
			let remainLength = totalLength - takenLength;
			Tools.changeViewChildStyle(
				this.el.nativeElement,
				'max-height',
				`${remainLength}px`
			);
		}
	}
}

export enum AXIS {
	VERTICAL = 'vertical', // |
	HORIZONTAL = 'horizontal', // __
}
