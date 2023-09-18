import { Pipe, PipeTransform } from '@angular/core';
import * as Luxon from 'luxon';

@Pipe({
	name: 'dateFormat',
})
export class DateFormatPipe implements PipeTransform {
	transform(iso: string,format?:string): string {
		const DateTime = Luxon.DateTime;
		if(!format)
			return DateTime.fromISO(iso).toFormat('f');
		else
			return DateTime.fromISO(iso).toFormat(format);
	}
}
