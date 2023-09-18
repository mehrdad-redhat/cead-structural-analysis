import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {CentralService} from '../../../../core/services';



@Component({
             templateUrl: './blank.panel.html',
             styleUrls: ['./blank.panel.scss'],
           })
export class BlankPanel implements OnInit {
  constructor(private route: ActivatedRoute,
              private _centralService: CentralService) {}
  
  ngOnInit(): void {}
}
