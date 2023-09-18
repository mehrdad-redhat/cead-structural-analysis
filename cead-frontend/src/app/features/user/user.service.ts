import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {BehaviorSubject, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {User} from '../../core/models';
import {UserGateway} from './user.gateway';

@Injectable()
export class UserService {
  private _userSubject = new BehaviorSubject<User>(null);
  
  setCurrentUser(user: User) {
    if (user !== null) {
      localStorage.setItem('currentUser', JSON.stringify(user));
      this._userSubject.next(user);
    } else {
      localStorage.removeItem('currentUser');
      this._userSubject.next(null);
    }
  }
  
  getCurrentUserStream(): Observable<User>  {
    return this._userSubject.asObservable();
  }
  
  getCurrentUserValue(): User{
    if(localStorage.getItem('currentUser')) 
      return new User(JSON.parse(localStorage.getItem('currentUser')));
       
    return null;
  }
  
  constructor(private router: Router, private _userGateway: UserGateway) {}
  
  signup(user: User, password: string) {
    return this._userGateway.signup(user, password);
  }
  
  login(email: string, password: string) {
    return this._userGateway.login(email, password).pipe(
        map(res => {
              this.setCurrentUser(res.data);
              return res;
            },
        ),
    );
  }
  
  logout(option?: { loginPage?: boolean; }) {
    this.setCurrentUser(null);
    if (!option?.loginPage)
      this.router.navigate(['user', 'login']).then(
          () => {
            location.reload();
          },
      );
  }
  
  getUserFromServer() {
    const userId = this.getCurrentUserValue()?._id;
    if(userId!==undefined){
      this._userGateway.getUser(userId).subscribe(user => {
        let accessToken = JSON.parse(localStorage.getItem('currentUser')).accessToken;
        this.setCurrentUser({...user,accessToken});
      });  
    }
  }
  
  editUser(userId,user){
    return this._userGateway.editUser(userId,user);
  }
  
  passChange(userId,old_pass,new_pass){
    return this._userGateway.passChange(userId,{
      old_pass,new_pass
    });
  }
}
