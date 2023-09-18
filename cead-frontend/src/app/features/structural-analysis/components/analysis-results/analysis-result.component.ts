import {Component, Input, OnInit} from '@angular/core';

@Component({
	selector: 'c-analysis-results',
	templateUrl: './analysis-result.component.html',
	styleUrls: ['./analysis-result.component.scss']
})
export class AnalysisResultComponent implements OnInit {
	
	private _data: any;
	someThingWrong:boolean=false;
	@Input()
	get data(): any {
		return this._data;
	}
	
	set data(value: any) {
		this.someThingWrong=false;
		this._data = value;
		if(Array.isArray(value.nodeDisplacements)&& value.nodeDisplacements.length===0){
			// this.someThingWrong=true;
		}
	}
	
	constructor() {}
	
	ngOnInit(): void {}
}
