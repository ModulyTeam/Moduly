import { Component, Input } from '@angular/core';
import { Module } from '../models/Module.model';
import {NgStyle} from "@angular/common";

@Component({
  selector: 'app-interactive-module',
  templateUrl: './interactive-module.component.html',
  standalone: true,
  imports: [
    NgStyle
  ],
  styleUrls: ['./interactive-module.component.css']
})
export class InteractiveModuleComponent {
  @Input() module: Module | undefined;

  // Variables para manejar la posición y el tamaño del módulo
  position = { x: 0, y: 0 };
  size = { width: 300, height: 200 };

  onMouseDown(event: MouseEvent) {
    event.preventDefault();
    // Lógica para iniciar el arrastre
  }

  onMouseMove(event: MouseEvent) {
    event.preventDefault();
    // Lógica para mover el módulo
  }

  onMouseUp(event: MouseEvent) {
    event.preventDefault();
    // Lógica para finalizar el arrastre
  }

  // Métodos para manejar el cambio de tamaño
  onResizeStart(event: MouseEvent) {
    // Lógica para iniciar el cambio de tamaño
  }

  onResize(event: MouseEvent) {
    // Lógica para cambiar el tamaño
  }

  onResizeEnd(event: MouseEvent) {
    // Lógica para finalizar el cambio de tamaño
  }
}
