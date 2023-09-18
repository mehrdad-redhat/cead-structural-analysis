import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {StructureQuery} from '../../state';
import {PropertyName, StructureData} from '../../types';

@Component({
  selector: 'c-properties-bar',
  templateUrl: './properties-bar.component.html',
  styleUrls: ['./properties-bar.component.scss'],
})
export class PropertiesBarComponent implements OnInit {
  PROPERTY_NAMES = PropertyName;
  @Output(
      'onActive') _onActive: EventEmitter<number> = new EventEmitter<number>();

  properties: Properties[] = [];
  activePropertyIndex: number;

  constructor(private structureQuery: StructureQuery) {
  }

  ngOnInit(): void {
    this.structureQuery.selectStructure().subscribe(sd => {
      if (sd) {
        this.setBarItems(sd);
      }
    });
    /**
     * Loads user state from local storage
     */
    this.activePropertyIndex = Number(
        localStorage.getItem('activatedPropertyBarIndex')) || 0;
    this.activeProperties(this.activePropertyIndex);
  }

// Methods
  activeProperties(index: number) {
    this.activePropertyIndex = index;
    /**
     * Loads user state from local storage
     */
    localStorage.setItem('activatedPropertyBarIndex', String(index));
    this._onActive.emit(index);
  }

  setBarItems(structureData: StructureData) {
    this.properties = [
      {
        name: this.PROPERTY_NAMES.STRUCTURE_INFO,
        icon: 'pi pi-info-circle',
      },
      {
        name: this.PROPERTY_NAMES.STRUCTURE_BASIC,
        icon: 'pi pi-book',
      },
      {
        name: this.PROPERTY_NAMES.WIRE_RUNS,
        icon: 'pi pi-pause',
        count: structureData?.wire_runs?.length || 0,
      },
      {
        name: this.PROPERTY_NAMES.ANCILLARY_WIRES,
        icon: 'pi pi-link',
        count: structureData?.ancillary_wires?.length || 0,
      },
      {
        name: this.PROPERTY_NAMES.ANCHORS,
        icon: 'pi pi-sort',
        count: structureData?.anchors?.length || 0,
      },
      {
        name: this.PROPERTY_NAMES.TIES,
        icon: 'pi pi-times-circle',
        count: structureData?.ties?.length || 0,
      },
      {
        name: this.PROPERTY_NAMES.SWITCHES,
        icon: 'pi pi-power-off',
        count: structureData?.switches?.length || 0,
      },
      {
        name: this.PROPERTY_NAMES.CONSTRUCTION_LOADS,
        icon: 'pi pi-chevron-circle-down',
        count: structureData?.construction_loads?.length || 0,
      },
    ];
  }

}

export interface Properties {
  name: string;
  icon: string;
  active?: boolean;
  count?: number;
}
