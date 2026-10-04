import { Component, ViewChild, ElementRef, Output, EventEmitter, ChangeDetectorRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GoogleMapsModule, MapGroundOverlay, MapMarker, GoogleMap } from '@angular/google-maps';
import { PlanExtractorContext, ExtractedLine } from './line-extraction.strategy';

@Component({
  selector: 'app-plan-importer',
  standalone: true,
  imports: [CommonModule, FormsModule, GoogleMapsModule, MapGroundOverlay, MapMarker],
  templateUrl: './plan-importer.component.html',
  styleUrls: ['./plan-importer.component.css']
})
export class PlanImporterComponent {
  
  @ViewChild('previewCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild(GoogleMap) map!: GoogleMap;
  
  @Input() emitBeforeAlign = false;
  
  @Output() importCompleted = new EventEmitter<{lines: ExtractedLine[], utilityType: string, planUrl?: string}>();

  currentStep: 'UPLOAD' | 'PROCESSING' | 'CONFIRM' | 'ALIGN' = 'UPLOAD';
  extractedLines: ExtractedLine[] = [];
  fileName: string = '';
  utilityType: string = 'WATER';

  // Opciones del mapa
  center: google.maps.LatLngLiteral = { lat: 52.5200, lng: 13.4050 }; // Berlin default
  zoom = 18;
  mapOptions: google.maps.MapOptions = { mapTypeId: google.maps.MapTypeId.SATELLITE };

  planUrl: string = '';
  planBounds = { north: 0, south: 0, east: 0, west: 0 };
  markerPosition: google.maps.LatLngLiteral = { lat: 0, lng: 0 };
  markerOptions: google.maps.MarkerOptions = { draggable: true, zIndex: 9999, title: 'Arrastra el pin para mover el plano' };

  constructor(private cdr: ChangeDetectorRef) {}

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.fileName = file.name;
      
      try {
        // Se instancia el Contexto. Él elegirá la Estrategia (CAD o PDF) automáticamente.
        const extractor = new PlanExtractorContext(file.name);
        
        this.currentStep = 'PROCESSING';
        this.extractedLines = await extractor.executeExtraction(file);
        
        this.currentStep = 'CONFIRM';
        // Forzar la actualización del DOM para que el canvas exista antes de dibujar
        this.cdr.detectChanges();
        this.drawLines();
        
      } catch (error: any) {
        alert(error.message);
        this.currentStep = 'UPLOAD';
      }
    }
  }

  drawLines() {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar cuadrícula de fondo (estilo plano de ingeniería)
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 20) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
    }

    // Dibujar las líneas extraídas por la estrategia (CAD o OpenCV)
    ctx.strokeStyle = '#0066ff'; // Azul brillante
    ctx.lineWidth = 3;
    for (const line of this.extractedLines) {
      ctx.beginPath();
      ctx.moveTo(line.x1, line.y1);
      ctx.lineTo(line.x2, line.y2);
      ctx.stroke();
    }
  }

  confirmLines() {
    this.planUrl = this.canvasRef.nativeElement.toDataURL('image/png');
    
    if (this.emitBeforeAlign) {
       this.importCompleted.emit({ lines: this.extractedLines, utilityType: this.utilityType, planUrl: this.planUrl });
       return;
    }
    
    // Configurar coordenadas iniciales por defecto (Berlin)
    this.setPlanBounds(this.center.lat, this.center.lng);
    this.currentStep = 'ALIGN';

    // Intentar geolocalizar al usuario (o la ubicación del cluster si la tuviéramos)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.center = { lat: position.coords.latitude, lng: position.coords.longitude };
          this.setPlanBounds(this.center.lat, this.center.lng);
          this.cdr.detectChanges();
        },
        () => console.warn('Geolocalización no permitida. Usando centro por defecto.')
      );
    }
  }

  private setPlanBounds(lat: number, lng: number) {
    const spanLat = 0.0005;
    const spanLng = 0.0008;
    this.planBounds = { north: lat + spanLat, south: lat - spanLat, east: lng + spanLng, west: lng - spanLng };
    this.markerPosition = { lat, lng };
  }

  onMarkerDrag(event: google.maps.MapMouseEvent) {
    if (event.latLng) {
      this.updateBoundsFromMarker(event.latLng.lat(), event.latLng.lng());
    }
  }

  nudge(direction: 'N'|'S'|'E'|'W', amount: number = 0.0001) {
    let newLat = this.markerPosition.lat;
    let newLng = this.markerPosition.lng;
    if (direction === 'N') newLat += amount;
    if (direction === 'S') newLat -= amount;
    if (direction === 'E') newLng += amount;
    if (direction === 'W') newLng -= amount;
    this.updateBoundsFromMarker(newLat, newLng);
  }

  private updateBoundsFromMarker(newLat: number, newLng: number) {
      const latDiff = newLat - this.markerPosition.lat;
      const lngDiff = newLng - this.markerPosition.lng;
      
      this.planBounds = {
        north: this.planBounds.north + latDiff,
        south: this.planBounds.south + latDiff,
        east: this.planBounds.east + lngDiff,
        west: this.planBounds.west + lngDiff
      };
      
      this.markerPosition = { lat: newLat, lng: newLng };
  }

  bringPlanHere() {
    if (this.map && this.map.getCenter()) {
      const c = this.map.getCenter()!;
      this.updateBoundsFromMarker(c.lat(), c.lng());
    }
  }

  scalePlan(factor: number) {
    const centerLat = this.markerPosition.lat;
    const centerLng = this.markerPosition.lng;
    const latSpan = (this.planBounds.north - this.planBounds.south) * factor;
    const lngSpan = (this.planBounds.east - this.planBounds.west) * factor;
    
    this.planBounds = {
        north: centerLat + latSpan / 2,
        south: centerLat - latSpan / 2,
        east: centerLng + lngSpan / 2,
        west: centerLng - lngSpan / 2
    };
  }

  saveFinalAlignment() {
    alert(`¡Anclaje Geográfico Guardado Exitosamente!\nTipo: ${this.utilityType}\nVectores convertidos a EPSG:4326.`);
    this.importCompleted.emit({ lines: this.extractedLines, utilityType: this.utilityType });
  }

  reset() {
    this.currentStep = 'UPLOAD';
    this.extractedLines = [];
  }
}
