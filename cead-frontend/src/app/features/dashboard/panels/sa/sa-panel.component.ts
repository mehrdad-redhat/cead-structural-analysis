import {AfterViewInit, Component, OnDestroy, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {MessageService} from 'primeng/api';

import {Subscription} from 'rxjs';
import {Project} from '../../../../core/models';
import {CentralService, StatusService} from '../../../../core/services';
import {DashboardService} from '../../dashboard.service';

@Component({
             templateUrl: './sa-panel.component.html',
             styleUrls: ['./sa-panel.component.scss'],
           })
export class SAPanel implements OnInit, AfterViewInit, OnDestroy {
  projects: Project[]=[];
  projectsStream: Subscription;
  newStructModalToggle: boolean = false;
  
  constructor(
      private _platformService: DashboardService,
      private messageService: MessageService,
      private router: Router,
      private _statusService: StatusService,
      private _centralService: CentralService
  ) {}
  
  ngOnInit(): void {
  
    this._statusService.setStatus({
                                    text: 'loading projects',
                                    ready: false,
                                    error: false,
                                  });
  }
  
// Methods
  ngAfterViewInit() {
    this._platformService.getSAProjectsList();
    
    setTimeout(() => {
      this.projectsStream = this._platformService.getSAProjectsListResult().
          subscribe(
              {
                next: (data) => {
                  if (data.length > 0) {
                    this.projects = data;
                  }
                  this._statusService.setStatus({
                    text: 'Ready',
                    ready: true,
                    error: false,
                  });
                },
                error: _ => {
                  this._statusService.setStatus({
                    text: 'Projects not loaded.',
                    ready: true,
                    error: true,
                  });
                },
              },
          );
    }, 0);
  }
  
  submit($event: any) {
    this.newStructModalToggle = !$event.state;
    this.router.navigate([`/platform/structural-analysis/${$event.structure._id}`]).then();
  }
  
  ngOnDestroy() {
    this.projects = [];
    if (this.projectsStream) {
      this.projectsStream.unsubscribe();
    }
  }
}
