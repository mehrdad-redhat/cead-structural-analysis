import {Component, OnInit} from '@angular/core';
import {StructureQuery} from '../../state';
import {PropertyName} from '../../types';

@Component({
  selector: 'c-properties-panel',
  templateUrl: './properties.panel.html',
  styleUrls: ['./properties.panel.scss'],
})
export class PropertiesPanel implements OnInit {

  PROPERTY_NAMES = PropertyName;
  activatedPanelIndex: number;
  structureData = this.structureQuery.selectStructure();

  constructor(private structureQuery: StructureQuery) {
  }

  ngOnInit(): void {
  }

// Methods
  activePanel(eq: number) {
    this.activatedPanelIndex = eq;
  }

}
