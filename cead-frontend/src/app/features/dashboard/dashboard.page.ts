import {Component, OnInit} from '@angular/core';
import {CentralService} from '../../core/services';

@Component({
	templateUrl: './dashboard.page.html',
	styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit {
	constructor(private _centralService: CentralService) {}
	
	ngOnInit(): void {
	}
	
}
