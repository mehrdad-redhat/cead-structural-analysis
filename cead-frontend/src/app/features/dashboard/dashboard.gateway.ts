import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {map} from 'rxjs/operators';
import {Response} from '../../core/models';
import {Structure} from '../structural-analysis/types';

@Injectable()
export class DashboardGateway {
	constructor(private http: HttpClient) {
	}

// Methods
	getSAProjectsList() {
		return this.http.get<any>('structural-analysis/project').
				pipe(map((res) => res.data));
	}

	createProject(name: string) {
		return this.http.post<Response>(
				`structural-analysis/project`, {name}).pipe(map((res) => res.data));
	}

	editProject(id: number, name: string) {
		return this.http.put<Response>(
						`structural-analysis/project/${id}`, {name}).
				pipe(map((res) => res.data));
	}

	createStructure(structure: Structure, project_id: number) {
		return this.http.post<Response>(
						`structural-analysis/structure`, {structure, project_id}).
				pipe(map((res) => res.data));
	}

	editStructure(id: number, name: string, location: string, revision: string) {
		return this.http.put<Response>(
						`structural-analysis/structure/${id}`, {name, location, revision}).
				pipe(map((res) => res.data));
	}
}
