import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {map} from 'rxjs/operators';
import {Response,User} from '../../core/models';



@Injectable()
export class UserGateway {
	constructor(private http: HttpClient) {}
	
	login(email:string, password:string) {
		return this.http.post<Response>('users/login',{email,password});
	}
	signup(user:User,password:string) {
		return this.http.post<Response>('users/signup', {...user,password});
	}
	
	getUser(userId){
		return this.http.get<Response>('users/'+userId).pipe(map(res => res.data));
	}
	
	editUser(userId,user){
		return this.http.put<Response>('users/'+userId,user).pipe(map(res => res.data));
	}
	
	passChange(userId,passObject){
		return this.http.post<Response>(`users/${userId}/password`,passObject).pipe(map(res => res.data));
	}
}
