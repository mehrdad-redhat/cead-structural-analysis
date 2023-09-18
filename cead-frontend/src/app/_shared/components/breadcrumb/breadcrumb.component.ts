import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import {Actions} from '@ngneat/effects-ng';
import {filter} from 'rxjs/operators';
import {
  CentralService,
  RouteData,
  StructureIdentity,
} from '../../../core/services';
import {StructureQuery} from '../../../features/structural-analysis/state';
import {
  revisionUpdateSubmitted,
} from '../../../features/structural-analysis/state/structure.actions';

@Component({
  selector: 'c-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss'],
})
export class BreadcrumbComponent implements OnInit {
  routeData: RouteData = {title: '', route: ''};
  @ViewChild('firstfocus') firstFocus!: ElementRef;
  structureIdentity: StructureIdentity = {
    _id: null,
    name: '',
    revision: '',
  };
  revisionEditToggle: boolean = false;
  revisionTemp: string = '';
  
  constructor(
      private _centralService: CentralService,
      private route: ActivatedRoute,
      private router: Router,
      private structureQuery: StructureQuery,
      private $action: Actions,
  ) {}
  
  ngOnInit(): void {
    this.structureQuery.selectIdentity().subscribe(str => {
      this.structureIdentity = {
        _id: str.id,
        name: str?.currentStructureData?.info?.structure_name,
        revision: str.revision,
      };
      this.revisionTemp = this.structureIdentity.revision;
    });

    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).
        subscribe(
            () => this.routeData = this.route.children[0].children[0].children[0].snapshot.data);

  }

// Methods
  revisionToggleController(state: string) {
    switch (state) {
      case'enable':
        this.revisionEditToggle = true;
        setTimeout(() => {
          this.firstFocus.nativeElement.focus();
        }, 0);
        break;
      case 'submit':
        console.log('SUBMITED');
        this.structureIdentity.revision = this.revisionTemp;
        this.$action.dispatch(revisionUpdateSubmitted({
          newRevision: this.structureIdentity.revision,
        }));
        this.revisionEditToggle = false;
        break;
      case 'cancel':
        this.revisionEditToggle = false;
        this.revisionTemp = this.structureIdentity.revision;
        break;
    }
  }
  
}
