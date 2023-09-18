import { Pipe, PipeTransform } from '@angular/core';
import { Tools } from '../../core/utils';

@Pipe({
	name: 'capitalize',
})
export class CapitalizePipe implements PipeTransform {
	transform(term: string, firstLetter?: boolean): string {
		return firstLetter
			? Tools.capitalizeFirstWord(term)
			: Tools.snakeCaseToCapitalize(term);
	}
}
