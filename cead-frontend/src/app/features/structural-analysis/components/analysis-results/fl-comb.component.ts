import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'c-fl-comb',
  template:`
      
	  <p-table [value]="data" styleClass="p-datatable-gridlines p-datatable-striped"
	           responsiveLayout="scroll">
		  <ng-template pTemplate="header">
			  <tr>
				  <th>Steelwork</th>
				  <th>Load Combination</th>
				  <th>Axial Permanent</th>
				  <th>Axial Variable</th>
				  <th>Shear Along Permanent</th>
				  <th>Shear Along Variable</th>
				  <th>Shear Across Permanent</th>
				  <th>Shear Across Variable</th>
				  <th>Moment Along Permanent</th>
				  <th>Moment Along Variable</th>
				  <th>Moment Across Permanent</th>
				  <th>Moment Across Variable</th>
				  <th>Torsion Permanent</th>
				  <th>Torsion Variable</th>
				  <th>Resultant Moment</th>
			  </tr>
		  </ng-template>
		  <ng-template pTemplate="body" let-fl>
			  <tr>
				  <td>{{fl['steelwork']|steelworkFilter}}</td>
				  <td>{{fl['lcName']}}</td>
				  <td>{{fl['axialPermanent']}}</td>
				  <td>{{fl['axialVariable']}}</td>
				  <td>{{fl['shearAlongPermanent']}}</td>
				  <td>{{fl['shearAlongVariable']}}</td>
				  <td>{{fl['shearAcrossPermanent']}}</td>
				  <td>{{fl['shearAcrossVariable']}}</td>
				  <td>{{fl['momentAlongPermanent']}}</td>
				  <td>{{fl['momentAlongVariable']}}</td>
				  <td>{{fl['momentAcrossPermanent']}}</td>
				  <td>{{fl['momentAcrossVariable']}}</td>
				  <td>{{fl['torsionPermanent']}}</td>
				  <td>{{fl['torsionVariable']}}</td>
				  <td>{{fl['resultantMoment']}}</td>
			  </tr>
		  </ng-template>
	  </p-table>


  `,
  styles: [
  ]
})
export class FlCombComponent implements OnInit {
  
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
