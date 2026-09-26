import { Pipe, PipeTransform } from '@angular/core';
import { capitalizarPrimera } from '../../core/utils/formato';

@Pipe({
  name: 'capitalizarPrimera',
  standalone: true
})
export class CapitalizarPrimeraPipe implements PipeTransform {
  transform(valor: string | null | undefined): string {
    return capitalizarPrimera(valor);
  }
}
