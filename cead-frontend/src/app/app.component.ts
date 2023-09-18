import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {PrimeNGConfig} from 'primeng/api';
import {CentralService} from './core/services';
import {UserService} from './features/user/user.service';

@Component({
             selector: 'cead-root',
             templateUrl: './app.component.html',
             styleUrls: ['./app.component.scss'],
           })
export class AppComponent implements OnInit {
  inGuardPage: boolean;
  
  constructor(
      private primengConfig: PrimeNGConfig,
      private route: ActivatedRoute,
      private router: Router,
      private _userService: UserService,
      private _centralService: CentralService,
  ) {}
  
  ngOnInit() {
    this._userService.getUserFromServer();
    this._centralService.setCurrentUserStream();
    this._userService.getCurrentUserStream().subscribe(user => {
      this.inGuardPage = !!user;
    });
    this.primengConfig.ripple = true;

  }
}
