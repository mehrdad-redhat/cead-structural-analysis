import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Actions} from '@ngneat/effects-ng';
import {Subscription} from 'rxjs';
import {toolPageLoaded} from './state/structure.actions';

@Component({
             templateUrl: './structural-analysis.page.html',
             styleUrls: ['./structural-analysis.page.scss'],
           })
export class StructuralAnalysisPage implements OnInit, OnDestroy {
  constructor(
      private route: ActivatedRoute,
      private actions$: Actions
  ) {}
  
  routerSub: Subscription;
  structureId: number;

  ngOnInit(): void {

    this.routerSub = this.route.paramMap.subscribe(
        (paramMap) => {
          this.structureId = Number(paramMap.get('struct_id'));
          this.actions$.dispatch(toolPageLoaded({id: this.structureId}));
        },
    );

  }

  ngOnDestroy() {
    if (this.routerSub)
      this.routerSub.unsubscribe();

  }
}
