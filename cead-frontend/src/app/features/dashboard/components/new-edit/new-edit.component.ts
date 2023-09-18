import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {MessageService} from 'primeng/api';
import {Project, ToastSeverity} from '../../../../core/models';
import {MSGS} from '../../../../data';
import {
  StructuralAnalysisService,
} from '../../../structural-analysis/services/structural-analysis.service';
import {Structure, StructureType} from '../../../structural-analysis/types';
import {DashboardService} from '../../dashboard.service';

@Component({
  selector: 'c-new-edit',
  templateUrl: './new-edit.component.html',
  styleUrls: ['./new-edit.component.scss'],
})
export class NewEditComponent implements OnInit, AfterViewInit {
  @ViewChild('firstFocus')
  firstFocus!: ElementRef;
  
  @Output() submitted = new EventEmitter<any>();
  
  structureTypes: string[] = [];
  newProject: boolean = false;
  saveToOptions: Option[];
  existingProjects: Option[] = [];

  newStructure: Structure;
  newStructureInfo = {
    structure_location: '',
    structure_name: '',
    structure_type: StructureType.CANTILEVER,
  };
  project_name: string;
  project_id: number;
  
  @Input('projectList') prList!: any;
  
  constructor(
      private _dashboardService: DashboardService,
      private _saService: StructuralAnalysisService,
      private messageService: MessageService,
  ) {
    
    this.structureTypes = [
      StructureType.CANTILEVER,
      StructureType.TTC,
      StructureType.PORTAL,
    ];
    this.saveToOptions = [
      {
        label: 'Existing Project',
        value: false,
      },
      {
        label: 'New Project',
        value: true,
      },
    ];
  }
  
  ngOnInit(): void {
    this.getProjectList();
  }
  
  ngAfterViewInit() {
    this.firstFocus.nativeElement.focus();
  }

// Methods
  getProjectList() {
    this._dashboardService.getSAProjectsListResult().subscribe((data) => {
      if (data.length > 0) {
        this.existingProjects = [];
        data.forEach((project: Project) => {
          this.existingProjects.push({
            label: project['name'],
            value: project['_id'],
          });
        });
        this.project_id = this.existingProjects[0].value;
      }
    });
  }
  
  requestProjectLists() {
    this._dashboardService.getSAProjectsList();
  }
  
  create($event: Event) {
    $event.preventDefault();
    if (this.newProject) {
      this._dashboardService.createProject(this.project_name).subscribe(
          data => {
            this.project_id = data.project_id;
            this.createStructure();
          },
      );
    } else {
      this.createStructure();
    }
  }
  
  createStructure() {
    this.newStructure = {
      structure_data: this._saService.makeNewStructure(
          this.newStructureInfo.structure_name,
          this.newStructureInfo.structure_type,
          this.newStructureInfo.structure_location,
      ),
    };

    this._dashboardService.createStructure(this.newStructure, this.project_id).
        subscribe(
            data => {
              this.messageService.add({
                severity: ToastSeverity.SUCCESS,
                summary: 'Structure created',
                detail: MSGS.SA.STRUCTURE_CREATE,
              });
              this.requestProjectLists();
              this.submitted.emit({state: true, structure: data.structure});

            },
    );
  }
}

interface Option {
  label: string;
  value: any;
}
