import {Injectable} from '@angular/core';
import {createEffect, ofType} from '@ngneat/effects';
import {mergeMap, of} from 'rxjs';
import {catchError, map, switchMap} from 'rxjs/operators';
import {
  StructuralAnalysisGateway,
} from '../services/structural-analysis.gateway';
import * as StructureActions from './structure.actions';
import {StructureStore} from './structure.store';


@Injectable()
export class StructureEffects {

  fetchStructure$;
  structureChange$;
  revisionChange$;

  constructor(
      private _saGateway: StructuralAnalysisGateway,
      private structureStore$: StructureStore,
  ) {
    this.fetchStructure$ = createEffect(actions => actions.pipe(
        ofType(StructureActions.toolPageLoaded),
        switchMap(action => this._saGateway.getStructure(action.id)),
        map(structure => {
              console.log('STRUCTURE FETCHED');
              this.structureStore$.update(state => ({
                ...state,
                id: structure._id,
                name: structure.name,
                type: structure.type,
                location: structure.location,
                revision: structure.revision,
                currentStructureData: structure.structure_data,
                skycivModel: structure.skyciv_model,
                analysisResults: structure.analyzed_data,
              }));
              localStorage.setItem('structureId', structure._id);
            },
        ),
    ));

    this.structureChange$ = createEffect(actions => actions.pipe(
        ofType(StructureActions.structureChangeSubmitted),
        mergeMap(action => {
          let structureId = Number(localStorage.getItem('structureId'));
          return this._saGateway.convertToSkycivModel(action.newStructureData,
              structureId).pipe(
              map(updateResponse => {
                console.log('SKYCIV MODEL UPDATED');
                this.structureStore$.update(state => ({
                  ...state,
                  skycivModel: updateResponse.skycivModel,
                  currentStructureData: updateResponse.structure.structure_data,
                }));
              }),
              catchError(error => {
                return of({
                  msg: 'UPDATE FAILED',
                  error,
                });
              }),
          );
        }),
    ));

    this.revisionChange$ = createEffect(actions => actions.pipe(
        ofType(StructureActions.revisionUpdateSubmitted),
        mergeMap(action => {
          let structureId = Number(localStorage.getItem('structureId'));
          return this._saGateway.setStructureRevision(action.newRevision,
              structureId).pipe(
              map(_ => {
                console.log('SKYCIV REVISION UPDATED');
                this.structureStore$.update(state => ({
                  ...state,
                  revision: action.newRevision,
                }));
              }),
              catchError(error => {
                return of({
                  msg: 'REVISION UPDATE FAILED',
                  error,
                });
              }),
          );
        }),
    ));
  }
  
}
