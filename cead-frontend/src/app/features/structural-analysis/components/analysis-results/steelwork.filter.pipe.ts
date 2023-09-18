import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'steelworkFilter'
})
export class SteelworkFilterPipe implements PipeTransform {

  transform(value: string, ...args: unknown[]): string {
    const SWNames = {
      masta: 'Mast A',
      mastb: 'Mast B',
      boom: 'Boom',
      tiea: 'Tie A',
      tieb: 'Tie B',
    };
    
    return SWNames[value];
  }

}
