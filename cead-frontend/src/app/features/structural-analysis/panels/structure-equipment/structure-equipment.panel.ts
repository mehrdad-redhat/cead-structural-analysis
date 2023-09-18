import {Component, Input, OnInit} from '@angular/core';
import {Actions} from '@ngneat/effects-ng';
import {ConfirmationService} from 'primeng/api';
import {MSGS} from '../../../../data';
import {
  StructuralAnalysisService,
} from '../../services/structural-analysis.service';
import {StructureQuery} from '../../state';
import {structureChangeSubmitted} from '../../state/structure.actions';
import {FormModel, PropertyName, StructureData} from '../../types';

const PROPERTY_NAMES = PropertyName;

@Component({
  selector: 'c-structure-equipment-panel',
  templateUrl: './structure-equipment.panel.html',
  styleUrls: [
    '../properties.styles.scss',
    './structure-equipment.panel.scss',
  ],
             providers: [ConfirmationService],
           })
export class StructureEquipmentPanel implements OnInit {
  // View Switches
  subPanelVisible: boolean = false;
  newEquipmentModalVisible: boolean = false;
  tableVisible: boolean = false;
  
  // Equipments list
  activatedIndex: number = 0;
  equipmentList: string[] = [];
  
  // New Equipment
  newEquipment: FormModel;
  lastId: number;

  structureData: StructureData;
  // Inputs
  @Input('panelSubject') subject: string;
  
  constructor(
      private _saService: StructuralAnalysisService,
      private confirmationService: ConfirmationService,
      private structureQuery: StructureQuery,
      private actions$: Actions,
  ) {}
  
  ngOnInit() {
    this.getStructureStream();
    this.enableEquipment(0, true);
  }

// Methods
  private getStructureStream() {
    this.structureQuery.selectStructure().subscribe(
        structureData => {
          if (structureData !== null) {
            this.structureData = structureData;
            this.makeEquipmentList();
          }
        },
    );
  }
  
  enableEquipment(index: number, initial: boolean = false) {
    this.activatedIndex = index;
    if (!initial) {
      this.subPanelVisible = false;
      this.subPanelVisible = true;
    }
  }
  
  makeEquipmentList() {
    let equipmentList = [];
    let equipments = this.structureData[this.subject];
    switch (this.subject) {
      case PROPERTY_NAMES.WIRE_RUNS:
        equipments.forEach((eq) => {
          equipmentList.push(`${eq.id} | ${eq.wire_run_number}`);
        });
        this.equipmentList = equipmentList;
        break;
      case PROPERTY_NAMES.ANCILLARY_WIRES:
        equipments.forEach((eq) => {
          equipmentList.push(`${eq.id} | ${eq.wire_name}`);
        });
        this.equipmentList = equipmentList;
        break;
      case PROPERTY_NAMES.ANCHORS:
        equipments.forEach((eq) => {
          equipmentList.push(`${eq.id} | ${eq.anchor_name}`);
        });
        this.equipmentList = equipmentList;
        break;
      case PROPERTY_NAMES.TIES:
      case PROPERTY_NAMES.SWITCHES:
      case PROPERTY_NAMES.CONSTRUCTION_LOADS:
        equipments.forEach((eq) => {
          equipmentList.push(`${eq.id} | ${eq.steel_support}`);
        });
        this.equipmentList = equipmentList;
        break;
      default:
        this.equipmentList = [];
    }
  }
  
  newEquipmentModalController(command: string, event?: Event) {
    switch (command) {
      case 'on':
        if (this.structureData[this.subject].length + 1 < 20) {
          this.lastId = this.structureData[this.subject].length;
          const newEquipment = this._saService.makeNewEquipment(this.subject,
              this.lastId + 1);
          this.structureData[this.subject].push(newEquipment);
          this.newEquipmentModalVisible = true;
        } else {
          this.confirmationService.confirm({
            target: event.target,
            message: MSGS.SA.EQUIPMENT_NUMBER_LIMIT,
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Ok',
            rejectVisible: false,
          });
        }
        break;
      case 'save':
        this.actions$.dispatch(structureChangeSubmitted(
            {newStructureData: this.structureData}));
        this.newEquipmentModalVisible = false;
        this.enableEquipment(this.lastId);
        break;
      case 'cancel':
      case 'off':
        this.structureData[this.subject].pop();
        this.newEquipmentModalVisible = false;
        break;
      default:
        throw new Error('Wrong command!');
    }
  }
  
  removeEquipment(index: number, event: Event) {
    event.stopPropagation();
    this.confirmationService.confirm({
                                       target: event.target,
                                       key: 'remove',
                                       message: MSGS.SA.REMOVE_EQUIPMENT,
                                       icon: 'pi pi-trash',
                                       acceptLabel: 'Yes',
                                       rejectLabel: 'No',
      accept: () => {
        if (this.activatedIndex === index)
          this.subPanelVisible = false;
        this.structureData[this.subject].splice(index, 1);
        this.actions$.dispatch(structureChangeSubmitted(
            {newStructureData: this.structureData}));
      },
    });
  }

  tableModalController(command: { action: string, structureData?: StructureData }) {
    switch (command.action) {
      case 'on':
        this.tableVisible = true;
        break;
      case 'save':
        this.actions$.dispatch(structureChangeSubmitted(
            {newStructureData: command.structureData}));
        this.tableVisible = false;
        break;
      case 'discard':
        this.tableVisible = false;
        break;
      default:
        throw new Error('Wrong command');
    }
  }
  
}
