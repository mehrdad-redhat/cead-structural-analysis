import {Component, OnInit} from '@angular/core';
import {StatusService} from '../../../core/services';



@Component({
	selector: 'c-status',
	templateUrl: './status.component.html',
	styleUrls: ['./status.component.scss']
})
export class StatusComponent implements OnInit {
	status: AppStatus;

	constructor(private _statusService: StatusService) {}

	ngOnInit(): void {
		this._statusService.getStatus()
				.subscribe(status =>{
					this.status = status;
		})
	}
	
	clearStatus() {
		this._statusService.clearStatus();
	}
}

export interface AppStatus{
	text: string;
	ready?: boolean;
	error?: boolean;
}
