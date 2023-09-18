import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ConfirmationService} from 'primeng/api';
import {MSGS} from '../../../../data';
import {FormSchemaService} from '../../services/form-schema.service';
import {
	StructuralAnalysisService,
} from '../../services/structural-analysis.service';
import {StructureQuery} from '../../state';
import {
	DISPLAY_TYPE,
	Equipment,
	PropertyName,
	Schema,
	StructureData,
} from '../../types';

@Component({
	selector: 'c-equipment-table',
	templateUrl: './equipment-table.component.html',
	styleUrls: ['./equipment-table.component.scss'],
	providers: [ConfirmationService],
})
export class EquipmentTableComponent implements OnInit {

	// Output
	@Output(
			'onAction') actionEvent = new EventEmitter<{ action: string, structureData: StructureData }>();

	// Inputs
	@Input('tableSubject') subject: string;

	// Types
	displayType = DISPLAY_TYPE;
	schema: Schema;
	childCols: Schema = [];
	editingRowObject: { [s: string]: boolean } = {null: true};
	editingRowId: any = null;

	structureData: StructureData;

	constructor(
			private confirmationService: ConfirmationService,
			private schemaService$: FormSchemaService,
			private structureQuery$: StructureQuery,
			private _saService: StructuralAnalysisService) {
	}

	ngOnInit() {
		this.getFormSchema();
		this.getStructure();
	}

// Methods
	private getFormSchema() {
		this.schemaService$.getFormSchema().subscribe(
				formSchema => {
					let tempSchema = JSON.parse(JSON.stringify(formSchema[this.subject]));
					let rootChildren;
					let rootIndex;
					for (let index in tempSchema) {
						const g = tempSchema[index];
						if (g.displayType === DISPLAY_TYPE.ROOT) {
							rootChildren = g.children;
							rootIndex = index;
							break;
						}
					}
					tempSchema.splice(rootIndex, 1);
					tempSchema = [...rootChildren, ...tempSchema];
					this.schema = tempSchema;
					this.makeChildColumns();
				},
		);
	}

	private getStructure() {
		this.structureQuery$.selectStructure().subscribe(
				structureData => {
					if (structureData)
						this.structureData = structureData;
				},
		);
	}

	makeChildColumns() {
		this.childCols = [];
		this.schema.forEach(col => {
			if (col.displayType === this.displayType.GROUP) {
				this.childCols = [...this.childCols, ...col.children];
			}
		});
	}
	
	/**
	 * Focus on first cell of new row
	 */
	rowEditInit() {
		this.editingRowObject = {};
		const eqListLength = this.structureData[this.subject].length;
		this.editingRowId = this.structureData[this.subject][eqListLength - 1].id;
		this.editingRowObject[String(this.editingRowId)] = true;
		setTimeout(() => {
			let editables = document.querySelectorAll('.p-editable-column');
			let desiredIndex =
					(editables.length * (this.structureData[this.subject].length - 1)) /
					this.structureData[this.subject].length;
			let el = editables[desiredIndex].children[0].children[0];
			(el as HTMLElement)?.focus();
		}, 0);
	}
	
	newRowEditSave() {
		delete this.editingRowObject[String(this.editingRowId)];
		this.editingRowId = null;
		this.editingRowObject[String(this.editingRowId)] = true;
	}
	
	newRowEditCancel() {
		this.structureData[this.subject].pop();
		delete this.editingRowObject[String(this.editingRowId)];
		this.editingRowId = null;
		this.editingRowObject[String(this.editingRowId)] = true;
	}
	
	addEquipment(event:Event,duplicate?: Equipment) {
		const equipmentNumber = this.structureData[this.subject].length;
		if(equipmentNumber+1<20){ // The structure can not have more than 20 equipments for each type of equipment.
			if (duplicate) {
				// deep copy
				let dup = JSON.parse(JSON.stringify(duplicate));
				dup.id = equipmentNumber + 1;
				dup = this.generateIdName(dup);
				this.structureData[this.subject].push(dup);
			} else {
				let newEquipment = this._saService.makeNewEquipment(this.subject,
						equipmentNumber + 1);
				this.structureData[this.subject].push(newEquipment);
			}
			this.rowEditInit();	
		}else{
			this.confirmationService.confirm({
				                                 target: event.target,
				                                 message: MSGS.SA.EQUIPMENT_NUMBER_LIMIT,
				                                 icon: 'pi pi-exclamation-triangle',
				                                 acceptLabel:'Ok',
				                                 rejectVisible:false
			                                 });
		}
	}

	removeEquipment(index) {
		this.structureData[this.subject].splice(index, 1);
	}

	cellEdited() {
	}

	actionDispatch(action: string) {
		this.actionEvent.emit({action, structureData: this.structureData});
	}

	generateIdName(eq) {
		switch (this.subject) {
			case PropertyName.WIRE_RUNS:
				eq['wire_run_number'] = `WR${eq.id}`;
				break;
			case PropertyName.ANCILLARY_WIRES:
				eq['wire_name'] = `EW${eq.id}`;
				break;
			case PropertyName.ANCHORS:
				eq['anchor_name'] = `ANC${eq.id}`;
				break;
		}
		return eq;
	}
}
