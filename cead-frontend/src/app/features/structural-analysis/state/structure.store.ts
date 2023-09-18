import {Injectable} from '@angular/core';
import {Store, StoreConfig} from '@datorama/akita';
import {
  SkycivAnalysisResults,
  SkycivModel,
  StructureData,
  StructureType,
} from '../types';

export interface StructureState {
  id: number;
  name: string;
  type: StructureType | '';
  location: string;
  revision: string;
  currentStructureData: StructureData | null;
  skycivModel: SkycivModel | null;
  analysisResults?: SkycivAnalysisResults | null;
}


export function createInitialState(): StructureState {
  return {
    id: null,
    name: '',
    type: '',
    location: '',
    revision: '',
    currentStructureData: null,
    skycivModel: null,
    analysisResults: null,
  };
}


@Injectable({
  providedIn: 'root',
})
@StoreConfig({name: 'structure'})
export class StructureStore extends Store<StructureState> {
  
  constructor() {
    super(createInitialState());
  }
  
}
