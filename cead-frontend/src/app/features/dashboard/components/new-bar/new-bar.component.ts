import {
	AfterViewInit,
	Component,
	ElementRef,
	HostListener,
	OnInit,
	ViewChild,
} from '@angular/core';

import {Tools} from '../../../../core/utils';

@Component({
	           selector: 'c-new-bar',
	           templateUrl: './new-bar.component.html',
	           styleUrls: ['./new-bar.component.scss'],
           })
export class NewBarComponent implements OnInit, AfterViewInit {
	@ViewChild('newBtns')
	newBtns!: ElementRef;
	
	newStructModalToggle: boolean = false;
	
	constructor() {
	}
	
	ngOnInit(): void {}
	
	ngAfterViewInit() {
		this.onResize();
	}
	
	
	@HostListener('window:resize', ['$event'])
	onResize() {
		let btns = this.newBtns.nativeElement.children;
		Array.from(btns).forEach((btn: HTMLElement) => {
			let icon = btn.firstChild;
			Tools.changeViewChildStyle(
					<HTMLElement>icon,
					'width',
					`${icon['offsetHeight']}px`,
			);
		});
	}
  
  submit($event: any) {
	  this.newStructModalToggle = !$event.state;
	  // this.router.navigate([`/platform/structural-analysis/${$event.structure._id}`]).then()
  }
}
