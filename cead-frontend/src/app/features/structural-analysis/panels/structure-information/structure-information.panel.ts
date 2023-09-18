import {Component, Input, OnInit} from '@angular/core';

@Component({
             selector: 'c-structure-info-panel',
             templateUrl: './structure-information.panel.html',
             styleUrls: [
               '../properties.styles.scss',
               './structure-information.panel.scss',
             ],
           })
export class StructureInformationPanel implements OnInit {
  
  @Input('panelSubject') subject: string;

  constructor() {
  }
  
  ngOnInit(): void {
  }
  
}
