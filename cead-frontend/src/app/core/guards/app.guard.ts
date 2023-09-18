import {Injectable} from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import {UserService} from '../../features/user/user.service';

@Injectable({providedIn: 'root'})
export class AuthGuard implements CanActivate {
  constructor(
      private router: Router,
      private _userService: UserService,
  ) { }
  
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const account = this._userService.getCurrentUserValue();
    if (account && account.accessToken) // authorized so return true
      return true;
    
    // not logged in so redirect to login page with the return url 
    this.router.navigate(
        ['/user/login'], {queryParams: {returnUrl: state.url}}).then();
    return false;
  }
}
