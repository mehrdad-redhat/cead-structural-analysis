import {createAction, props} from '@ngneat/effects';
import {StructureData} from '../types';

export const toolPageLoaded = createAction(
    '[Structural Analysis] Structural Analysis Page Loaded',
    props<{ id: number }>(),
);

export const structureChangeSubmitted = createAction(
    '[Structure Equipment|Info Panel] One of Inputs Change Submitted',
    props<{ newStructureData: StructureData }>(),
);

export const revisionUpdateSubmitted = createAction(
    "[Breadcrumb] Structure Revision Updated",
    props<{newRevision:string}>()
)
