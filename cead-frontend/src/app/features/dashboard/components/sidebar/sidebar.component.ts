import {Component, OnInit} from '@angular/core';
import {CentralService} from '../../../../core/services';

// noinspection DuplicatedCode
@Component({
             selector: 'c-sidebar',
             templateUrl: './sidebar.component.html',
             styleUrls: ['./sidebar.component.scss'],
           })
export class SidebarComponent implements OnInit {
  totalApiCalls: number = 0;
  usedApiCalls: number = 0;
  limited: boolean=false;
  knobColor:string;
  constructor(private _centralService: CentralService) {}
  
  ngOnInit(): void {
    this._centralService.getCurrentUserStream().subscribe(
        (user) => {
          if (user){
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
  
  
}
