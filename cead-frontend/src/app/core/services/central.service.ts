import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {UserService} from '../../features/user/user.service';
import {User} from '../models';

@Injectable({
	providedIn: 'root',
})
export class CentralService {

	constructor(private _userService: UserService,
	) {
	}

	private _currentUser = new BehaviorSubject<User>(null);

// Methods
	setCurrentUserStream() {
		this._userService.getCurrentUserStream().subscribe(
				(user) => {
					this._currentUser.next(user);
				},
		);
	}
	
	getCurrentUserStream():Observable<User>{
		return this._currentUser.asObservable();
	}
	
	getUserFromServer(){
		this._userService.getUserFromServer();
	}
	
	
	
}

export interface StructureIdentity{
	_id?:number;
	name?:string;
	revision?:string;
}

export interface RouteData {
	title?:string;
	route?:string;
}
