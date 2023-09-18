import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import * as Luxon from 'luxon';
import {MessageService} from 'primeng/api';
import {CentralService, StatusService} from '../../../../core/services';
import {
  StructuralAnalysisService,
} from '../../services/structural-analysis.service';
import {StructureQuery} from '../../state';
import {StructureData} from '../../types';

declare var SKYCIV: any;

@Component({
  selector: 'c-render-panel',
  templateUrl: './render.panel.html',
  styleUrls: ['./render.panel.scss'],
})
export class RenderPanel implements OnInit, OnDestroy {

  @Input() structureId !: number;

  private structureData: StructureData;
  private skycivModel: any;
  private skycivViewer: any;
  private renderSetting: any;
  private thumbnailCounter: number = 0;
  private initialRender: boolean = true;

  constructor(
      private _saService: StructuralAnalysisService,
      private route: ActivatedRoute,
      private messageService: MessageService,
      private _statusService: StatusService,
      private _centralService: CentralService,
      private structureQuery: StructureQuery,
  ) {}
  
  ngOnInit(): void {
    this.setupRenderer();
    this.getStructureStream();
    this.getSkycivModelStream();
    this._saService.watchForScreenshot().subscribe(cmd => {
      if (cmd === 'Take Screenshot') {
        this.saveScreenshot();
      }
    });
  }

  /* GETTING DATA */

// Methods
  saveScreenshot(option?: { base64: boolean, cb: (data: any) => void }) {
    const DateTime = Luxon.DateTime;
    const currentDate = DateTime.fromJSDate(new Date()).
        toFormat('yyyy-MM-dd-H-mm-ss');

    if (option?.base64) {
      this.skycivViewer.screenshot.get({
        axis: true,
        background: '#DFEAF6',
        callback: option.cb,
      });
    } else {
      this.skycivViewer.screenshot.save({
        axis: true,
        background: '#DFEAF6',
        filename: `cead-structure-${this.structureId}-render-${currentDate}.png`,
      });
      this._statusService.setStatus({
        text: 'Screenshot saved',
        ready: true,
        error: false,
      });
    }
  }

  private getStructureStream() {
    this.structureQuery.selectStructure().subscribe(
        structureData => {
          if (structureData)
            this.structureData = structureData;
          // if(!this.skycivModel&&this.structureData?.basics?.mast_a?.steelwork){
          //   this.updateModel();
          // }
        },
    );
  }

  /* RENDERER */

  private getSkycivModelStream() {
    this.structureQuery.selectSkycivModel().subscribe(
        skycivModel => {
          if (skycivModel) {
            this.skycivModel = skycivModel;
            this.updateRenderer();
          }
        },
    );
  }

  private setupRenderer() {
    this.skycivViewer = new SKYCIV.renderer({
      container_selector: '#renderer-container',
    });
    this.skycivViewer.settings.set({
                                     colors: true,
                                     opacity: 1,
      
                                     visibility: {
                                       logo: false,
                                       floor: false,
                                       nodes: false,
                                       members: true,
                                       plates: false,
                                       plates_mesh: false,
                                       global_origin_axis: false,
                                       global_axis: true,
                                       local_axis: false,
                                     },
                                   });
    
    this.skycivViewer.hideLogo();
    let menu = this.skycivViewer.menu.getContainer();
    menu[0].children[4].style.display = 'none';
    menu[0].children[5].style.display = 'none';
    menu[0].children[6].style.display = 'none';
    menu[0].children[7].style.display = 'none';
  }
  
  private updateRenderer() {
    this.renderSetting = {
      units: {
        length: 'm',
        section_length: 'mm',
        material_strength: 'MPa',
        density: 'kg/m^3',
        force: 'kN',
        moment: 'kN-m',
        pressure: 'kPa',
        mass: 'kg',
        translation: 'mm',
        stress: 'MPa',
      },
      evaluation_points: '5',
      auto_stabilize_model: false,
      member_offsets_axis: 'global',
      show_offsets_visually: 'true',
    };
    let s3d_model = {settings: this.renderSetting, ...this.skycivModel};
    if (this.skycivViewer) {
      this.skycivViewer.model.set(s3d_model);
      this.skycivViewer.model.buildStructure(true);
      this.skycivViewer.render();
      if (this.initialRender) {
        this.skycivViewer.setView('custom', {
          x: -15,
          y: 15,
          z: 22,
        });
        this.initialRender = false;
      }
      
      if (this.thumbnailCounter % 10 === 0)
        this.saveScreenshot({
          base64: true,
          cb: (data) => {
            this._saService.saveThumbnail(data, this.structureId).
                subscribe(_ => {
                });
          },
        });
      this.thumbnailCounter++;
    }
  }

  ngOnDestroy() {
    this.saveScreenshot({
      base64: true,
      cb: (data) => {
        this._saService.saveThumbnail(data, this.structureId).subscribe(_ => {
        });
      },
    });
  }

}
