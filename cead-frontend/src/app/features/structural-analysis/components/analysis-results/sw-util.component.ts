import {Component, Input, OnInit} from '@angular/core';

@Component({
             selector: 'c-sw-util',
             template: `
	
	             <p-table [value]="data" styleClass="p-datatable-gridlines p-datatable-striped"
	                      responsiveLayout="scroll">
		             <ng-template pTemplate="header">
			             <tr>
				             <th></th>
				             <th>Mast A</th>
				             <th>Boom</th>
				             <th>Mast B</th>
				             <th>Tie A</th>
				             <th>Tie B</th>
			             </tr>
		             </ng-template>
		             <ng-template pTemplate="body" let-sw>
			             <tr>
				             <td>{{sw['name']}}</td>
				             <td>{{sw['masta']}}</td>
				             <td>{{sw['boom']}}</td>
				             <td>{{sw['mastb']}}</td>
				             <td>{{sw['tiea']}}</td>
				             <td>{{sw['tieb']}}</td>
			             </tr>
		             </ng-template>
	             </p-table>

             `,
             styles: [],
           })
export class SwUtilComponent implements OnInit {
  
  private _data: any;
  @Input()
  get data(): any {
    return this._data;
  }
  
  set data(value: any) {
    this._data=[];
    this._data[0]={ // Utilisation
      name:'Utilisation',
      masta:value['masta'].value,
      boom:value['boom'].value,
      mastb:value['mastb'].value,
      tiea:value['tiea'].value,
      tieb:value['tieb'].value,
    };
    this._data[1]={ // Load Case
      name:'Load Case',
      masta:value['masta'].lcName,
      boom:value['boom'].lcName,
      mastb:value['mastb'].lcName,
      tiea:value['tiea'].lcName,
      tieb:value['tieb'].lcName,
    };
  }
  
  constructor() { }
  
  ngOnInit(): void {
  }
  
}
