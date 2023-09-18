import {Injectable} from '@angular/core';
import {Query} from '@datorama/akita';
import {map} from 'rxjs/operators';
import {StructureState, StructureStore} from './structure.store';

@Injectable({
  providedIn: 'root',
})
export class StructureQuery extends Query<StructureState> {

  constructor(protected store: StructureStore) {
    super(store);
  }

// Methods
  selectStructure() {
    return this.select().pipe(
        map(str => {
          return str.currentStructureData;
        }),
    );
  }

  selectSkycivModel() {
    return this.select().pipe(
        map(str => {
          return str.skycivModel;
        }),
    );
  }

  selectAnalysisResults() {
    return this.select().pipe(
        map(str => {
          return str.analysisResults;
        }),
    );
  }

  selectIdentity() {
    return this.select().pipe(
        map(str => {
          return str;
        }),
    );
  }

}
