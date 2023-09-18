import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserService } from '../../features/user/user.service';


@Injectable()
export class JwtInterceptor implements HttpInterceptor {
	constructor(private _userService: UserService) { }
	
	intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
		// add auth header with jwt if account is logged in and request is to the api url
		const account = this._userService.getCurrentUserValue();
		if (account && account.accessToken) {
			request = request.clone({
				                        setHeaders: { Authorization: `Bearer ${account.accessToken}` }
			                        });
		}
		
		return next.handle(request);
	}
}
