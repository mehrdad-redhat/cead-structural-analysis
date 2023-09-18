import { Injectable } from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {AppStatus} from '../../_shared/components';

@Injectable({
	providedIn: 'root',
})
export class StatusService {
	constructor() {}
	
	private _status = new BehaviorSubject<AppStatus>({
		text:'ready',
		ready:true,
		error:false
	                                                 });
	
	getStatus(): Observable<AppStatus> {
		return this._status.asObservable();
	}
	
	setStatus(state : AppStatus){
		this._status.next(state);
	}
	
	clearStatus(){
		this._status.next({
			                  text:'ready',
			                  ready:true,
			                  error:false
		                  });
	}
}
