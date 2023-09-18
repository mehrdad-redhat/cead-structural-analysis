import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {Project} from '../../core/models';
import {Structure} from '../structural-analysis/types';
import {DashboardGateway} from './dashboard.gateway';

@Injectable()
export class DashboardService {
	private _projectListSubject = new BehaviorSubject<Project[]>([]);

	constructor(private _dashboardGateway: DashboardGateway) {
	}

// Methods
	getSAProjectsList() {
		this._dashboardGateway.getSAProjectsList().subscribe((data: Project[]) => {
			this._projectListSubject.next(data);
		});
	}

	getSAProjectsListResult(): Observable<Project[]> {
		return this._projectListSubject.asObservable();
	}

	createProject(name: string) {
		return this._dashboardGateway.createProject(name);
	}

	editProject(id: number, name: string) {
		return this._dashboardGateway.editProject(id, name);
	}

	createStructure(structure: Structure, projectId: number) {
		return this._dashboardGateway.createStructure(structure, projectId);
	}

	editStructure(id: number, name: string, location: string, revision: string) {
		return this._dashboardGateway.editStructure(id, name, location, revision);
	}
}
