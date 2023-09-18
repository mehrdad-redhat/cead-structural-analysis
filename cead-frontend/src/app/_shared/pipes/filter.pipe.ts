import { Pipe, PipeTransform } from '@angular/core';



/**
 * it's a pipe named 'filter' that receives a array of objects and
 * find the objects that have (value)'s value
 */
@Pipe({ name: 'filter' })
export class FilterPipe implements PipeTransform {
	transform(arr: any[], value: string): any[] {
		let result: any[] = [];

		if (value == '' || !value) {
			result = arr;
		} else {
			for (let item of arr) {
				for (let key in item) {
					if (!item.hasOwnProperty(key)) {
						continue;
					}
					if (typeof item[key] != 'object' && typeof item[key] != 'number') {
						if (item[key].search(value) > -1) {
							result.push(item);
						}
					}
				}
			}
		}

		return result;
	}
}
