import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {map} from 'rxjs/operators';
import {Response} from '../../../core/models';
import {StructureData} from '../types';

@Injectable({
  providedIn: 'root',
})
export class StructuralAnalysisGateway {
  constructor(private http: HttpClient) {
  }

  getStructure(id: number) {
    return this.http.get<Response>(`structural-analysis/structure/${id}`).
        pipe(map((res) => res.data));
  }

// Methods
  convertToSkycivModel(structure_data: StructureData, id: number) {
    const alf = localStorage.getItem('alf');
    return this.http.post<Response>(
        `structural-analysis/structure/${id}/update-skyciv-model?alf=${alf ||
        0}`, {structure_data}).pipe(map((res) => res.data));
  }

  solveModel(id: number) {
    return this.http.get<Response>(
            `structural-analysis/structure/${id}/analyze`).
        pipe(map((res) => res.data));
  }

  setStructureRevision(revision: string, id: number) {
    return this.http.post<Response>(
        `structural-analysis/structure/${id}/update-revision`, {revision}).pipe(map((res) => res.data));
  }
  
  setStructureThumbnail(thumbnail: string,id:number) {
    return this.http.post<Response>(
        `structural-analysis/structure/${id}/update-thumbnail`, {preview_url:thumbnail}).pipe(map((res) => res.data));
  }
  
  getAnalysisResults(id:number){
    return this.http.get<Response>(
        `structural-analysis/structure/${id}/results`).pipe(map((res) => res.data));
  }
}
