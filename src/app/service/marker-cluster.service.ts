import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet.markercluster';

@Injectable({
  providedIn: 'root'
})
export class MarkerClusterService {
  private markerClusterGroup: L.MarkerClusterGroup;

  constructor() {
    this.markerClusterGroup = L.markerClusterGroup({
      maxClusterRadius: 50,
      disableClusteringAtZoom: 15,
    });
  }

  getMarkerClusterGroup(): L.MarkerClusterGroup {
    return this.markerClusterGroup;
  }

  clearMarkers(): void {
    this.markerClusterGroup.clearLayers();
  }

  addMarker(marker: L.Marker): void {
    this.markerClusterGroup.addLayer(marker);
  }

  addMarkers(markers: L.Marker[]): void {
    markers.forEach(marker => this.markerClusterGroup.addLayer(marker));
  }
}
