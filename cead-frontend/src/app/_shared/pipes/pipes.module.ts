import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DateFormatPipe} from './date-format.pipe';
import {FilterPipe} from './filter.pipe';
import {CreateTimePipe} from './time-format.pipe';
import {CapitalizePipe} from './capitalize.pipe';



@NgModule({
            imports: [CommonModule],
            declarations: [FilterPipe, CreateTimePipe, CapitalizePipe, DateFormatPipe],
            exports: [FilterPipe, CreateTimePipe, CapitalizePipe, DateFormatPipe],
          })
export class PipesModule {}
