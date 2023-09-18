import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'c-fl-case',
  template:`
	
	  <p-table [value]="data" styleClass="p-datatable-gridlines p-datatable-striped"
	           responsiveLayout="scroll">
		  <ng-template pTemplate="header">
			  <tr>
				  <th>Steelwork</th>
				  <th>Load Case</th>
				  <th>Axial</th>
				  <th>Shear Along</th>
				  <th>Shear Across</th>
				  <th>Moment Along</th>
				  <th>Moment Across</th>
				  <th>Torsion</th>
			  </tr>
		  </ng-template>
		  <ng-template pTemplate="body" let-flc>
			  <tr>
				  <td>{{flc['steelwork']|steelworkFilter}}</td>
				  <td>{{flc['loadCase']}}</td>
				  <td>{{flc['axial']}}</td>
				  <td>{{flc['shearAlong']}}</td>
				  <td>{{flc['shearAcross']}}</td>
				  <td>{{flc['momentAlong']}}</td>
				  <td>{{flc['momentAcross']}}</td>
				  <td>{{flc['torsion']}}</td>
			  </tr>
		  </ng-template>
	  </p-table>


  `,
  styles: [
  ]
})
export class FlCaseComponent implements OnInit {
  
  private _data: any;
  @Input()
  get data(): any {
    return this._data;
  }
  
  set data(value: any) {
    this._data = value;
  }
  
  constructor() { }

  ngOnInit(): void {
  }

}
