import {Component, Input, OnInit} from '@angular/core';
import {MessageService} from 'primeng/api';
import {Project} from '../../../../core/models';

import {DashboardService} from '../../dashboard.service';

@Component({
  selector: 'c-projects-list',
  templateUrl: './projects-list.component.html',
  styleUrls: ['./projects-list.component.scss'],
})

export class ProjectsListComponent implements OnInit {
  @Input()
  projects: Project[];
  projectsClone: Project[] = [];
  structuresClone: any = [];

  constructor(
      private _platformService: DashboardService,
      private messageService: MessageService,
  ) {
  }

  ngOnInit(): void {
  }

// Methods
  onPrRowEditInit(project: Project) {
    this.projectsClone[project._id] = {...project};
  }

  onPrRowEditSave(project: Project, index: number) {
    this._platformService.editProject(project._id, project.name).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Project is updated',
            });
            delete this.projectsClone[project._id];
          },
          error: (error) => {
            this.projects[index] = this.projectsClone[project._id];
            delete this.projectsClone[project._id];
            console.error(error);
          },
        },
    );
  }

  onPrRowEditCancel(project: Project, index: number) {
    this.projects[index] = this.projectsClone[project._id];
    delete this.projectsClone[project._id];
  }

  onStRowEditInit(structure: any, prIndex: number) {
    this.structuresClone[structure._id] = {...structure};
  }

  onStRowEditSave(structure: any, index: number, prId: number) {
    this._platformService.editStructure(structure._id, structure.name,
        structure.location, structure.revision).subscribe(
        {
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Structure is updated',
            });
            delete this.structuresClone[structure._id];
          },
          error: (error) => {
            const prIndex = this.projects.findIndex(pr => pr._id === prId);
            this.projects[prIndex]['structures'][index] = this.structuresClone[structure._id];
            delete this.structuresClone[structure._id];
            console.error(error);
          },
        },
    );
  }

  onStRowEditCancel(structure: any, index: number, prId: number) {
    const prIndex = this.projects.findIndex(pr => pr._id === prId);
    this.projects[prIndex]['structures'][index] = this.structuresClone[structure._id];
    delete this.structuresClone[structure._id];
  }
}
