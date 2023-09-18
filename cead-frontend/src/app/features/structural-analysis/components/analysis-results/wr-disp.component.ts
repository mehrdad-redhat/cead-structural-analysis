import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'c-wr-disp',
  template:`
	
	  <p-table [value]="data" styleClass="p-datatable-gridlines p-datatable-striped"
	           responsiveLayout="scroll">
		  <ng-template pTemplate="header">
			  <tr>
				  <th>Wire Run</th>
				  <th>Load Combination</th>
				  <th>Member ID</th>
				  <th>Across Track Displacement</th>
				  <th>Across Track Status</th>
				  <th>Along Track Displacement</th>
				  <th>Along Track Status</th>
			  </tr>
		  </ng-template>
		  <ng-template pTemplate="body" let-wr>
			  <tr>
				  <td>{{wr['wireRun']}}</td>
				  <td>{{wr['lcName']}}</td>
				  <td>{{wr['memberId']}}</td>
				  <td>{{wr['acrossTrackDisplacement']}}</td>
				  <td [class.notPass]="wr['acrossTrackStatus']!=='Pass'"
				      [class.pass]="wr['acrossTrackStatus']==='Pass'">{{wr['acrossTrackStatus']}}</td>
				  <td>{{wr['alongTrackDisplacement']}}</td>
				  <td [class.notPass]="wr['alongTrackStatus']!=='Pass'"
				      [class.pass]="wr['alongTrackStatus']==='Pass'">{{wr['alongTrackStatus']}}</td>
			  </tr>
		  </ng-template>
	  </p-table>

  `,
  styles: [
    `
	    td.pass {
	      background-color: rgb(195 223 149 / 72%);
      }
      td.notPass{
	      background-color: rgb(223 149 165 / 72%);
      }
    `
  ]
})
export class WrDispComponent implements OnInit {
  
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
