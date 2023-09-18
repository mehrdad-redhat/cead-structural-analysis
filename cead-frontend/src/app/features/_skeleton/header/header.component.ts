import {Component, OnInit} from '@angular/core';
import {User} from '../../../core/models';
import {UserService} from '../../user/user.service';

// noinspection DuplicatedCode
@Component({
             selector: 'c-header',
             templateUrl: './header.component.html',
             styleUrls: ['./header.component.scss'],
           })
export class HeaderComponent implements OnInit {
  constructor(private _userService: UserService) {}
  
  user: User;
  totalApiCalls: number = 0;
  usedApiCalls: number = 0;
  limited: boolean=false;
  knobColor:string;
  ngOnInit(): void {
    
    this._userService.getCurrentUserStream().subscribe(
        (user) => {
          if (user){
            this.user = user;
            this.usedApiCalls = +user.cur_api_call;
            this.totalApiCalls = +user.max_api_call;
            this.limited = user.notallowed_api;
            switch (true) {
              case this.usedApiCalls/this.totalApiCalls <= 0.5:
                this.knobColor='#81C784';
                break;
              case this.usedApiCalls/this.totalApiCalls <= 0.75:
                this.knobColor='#FFE082';
                break;
              case this.usedApiCalls/this.totalApiCalls < 1:
                this.knobColor='#F48FB1';
                break;
              case this.usedApiCalls/this.totalApiCalls >= 1:
                this.knobColor='#ff004d';
                break;
              default:
                this.knobColor='#939393';
                break;
            }
          }
        }
    );
    
  }
  
  logout() {
    this._userService.logout();
  }
}
