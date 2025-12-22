import React, { useMemo, useState, useEffect, memo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { InternalOperation, OutsourceOperation, WorkingSite } from '../../types';
import { formatDateDDMMYYYY } from '../../lib/dateUtils';
import styles from './MachineryMap.module.css';

// Fix for default marker icons in Leaflet with Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Constants
const IDLE_MACHINERY_COORDS: [number, number] = [36.934308, 30.777931];
const IDLE_MACHINERY_ADDRESS = 'Altınova Orta, 33. Sokak No:3 Kepez Antalya';
const DEFAULT_CENTER: [number, number] = [36.8969, 30.7133];
const DEFAULT_ZOOM = 11;

// Create colored marker icons using Apple Maps style
const createColoredMarkerIcon = (color: string) => {
  const uniqueId = `icon-${color.replace('#', '').replace(/[^a-zA-Z0-9]/g, '')}-${Math.random().toString(36).substring(2, 9)}`;
  const svgIcon = `
    <svg width="28" height="40" xmlns="http://www.w3.org/2000/svg" style="display: block;">
      <defs>
        <filter id="shadow-${uniqueId}" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
          <feOffset dx="0" dy="2" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <path fill="${color}" stroke="#fff" stroke-width="2" filter="url(#shadow-${uniqueId})" 
            d="M14 0C6.268 0 0 6.268 0 14c0 3.314 2.686 6 6 6h2l-2 8h12l-2-8h2c3.314 0 6-2.686 6-6C28 6.268 21.732 0 14 0z"/>
      <path fill="${color}" stroke="#fff" stroke-width="2" 
            d="M14 0C6.268 0 0 6.268 0 14c0 3.314 2.686 6 6 6h2l-2 8h12l-2-8h2c3.314 0 6-2.686 6-6C28 6.268 21.732 0 14 0z"/>
      <circle fill="#fff" cx="14" cy="14" r="4"/>
    </svg>
  `;
  
  return L.divIcon({
    className: 'custom-marker-icon',
    html: svgIcon,
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -40],
  });
};

// Create idle machinery icon - Google Maps style location pin (orange)
const createIdleIcon = () => {
  return L.divIcon({
    className: 'idle-machinery-marker',
    html: `
      <div style="
        position: relative;
        width: 0;
        height: 0;
      ">
        <svg width="40" height="50" viewBox="0 0 40 50" style="
          position: absolute;
          left: -20px;
          top: -50px;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        ">
          <!-- Pin shadow -->
          <ellipse cx="20" cy="46" rx="8" ry="3" fill="rgba(0,0,0,0.2)"/>
          <!-- Pin body - orange color -->
          <path d="M20 0 C9 0 0 9 0 20 C0 30 20 50 20 50 C20 50 40 30 40 20 C40 9 31 0 20 0 Z" 
                fill="#f97316" 
                stroke="#fff" 
                stroke-width="2"/>
          <!-- Inner circle -->
          <circle cx="20" cy="20" r="8" fill="#fff"/>
          <circle cx="20" cy="20" r="5" fill="#f97316"/>
        </svg>
      </div>
    `,
    iconSize: [40, 50],
    iconAnchor: [20, 50], // Anchor at the bottom tip of the pin
    popupAnchor: [0, -50],
  });
};

// Create red icon for internal operations - Google Maps style location pin (red)
const createRedIcon = () => {
  return L.divIcon({
    className: 'internal-operation-marker',
    html: `
      <div style="
        position: relative;
        width: 0;
        height: 0;
      ">
        <svg width="40" height="50" viewBox="0 0 40 50" style="
          position: absolute;
          left: -20px;
          top: -50px;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        ">
          <!-- Pin shadow -->
          <ellipse cx="20" cy="46" rx="8" ry="3" fill="rgba(0,0,0,0.2)"/>
          <!-- Pin body - red color -->
          <path d="M20 0 C9 0 0 9 0 20 C0 30 20 50 20 50 C20 50 40 30 40 20 C40 9 31 0 20 0 Z" 
                fill="#ef4444" 
                stroke="#fff" 
                stroke-width="2"/>
          <!-- Inner circle -->
          <circle cx="20" cy="20" r="8" fill="#fff"/>
          <circle cx="20" cy="20" r="5" fill="#ef4444"/>
        </svg>
      </div>
    `,
    iconSize: [40, 50],
    iconAnchor: [20, 50], // Anchor at the bottom tip of the pin
    popupAnchor: [0, -50],
  });
};

// Pre-create icons for better performance
const redIcon = createRedIcon(); // Red Google Maps style pin for internal operations
const blueIcon = createColoredMarkerIcon('#3b82f6');
const idleIcon = createIdleIcon(); // Orange Google Maps style pin for idle machinery

// Offset markers at the same location using spiral pattern
// This creates a tight cluster with markers evenly distributed in a spiral
function offsetMarkerPosition(
  baseCoords: [number, number],
  index: number,
  total: number
): [number, number] {
  if (total <= 1) return baseCoords;
  
  const [baseLat, baseLng] = baseCoords;
  if (!Number.isFinite(baseLat) || !Number.isFinite(baseLng)) {
    return baseCoords;
  }
  
  // Spiral pattern using golden angle (137.5 degrees) for even distribution
  const goldenAngle = 137.508; // Golden angle in degrees
  const angle = (index * goldenAngle) * (Math.PI / 180);
  
  // Calculate radius - start small and increase gradually
  // This creates a spiral that starts tight and expands outward
  const baseRadius = 0.0002; // Base radius for spacing
  const radius = baseRadius * Math.sqrt(index + 1); // Square root for smooth expansion
  
  const offsetLat = radius * Math.cos(angle);
  const offsetLng = radius * Math.sin(angle);
  
  return [baseLat + offsetLat, baseLng + offsetLng];
}

// Parse location string to coordinates
function parseLocation(location: string): [number, number] | null {
  if (!location || typeof location !== 'string') return null;
  
  const coords = location.split(',').map((s) => s.trim());
  if (coords.length === 2) {
    const lat = parseFloat(coords[0]);
    const lng = parseFloat(coords[1]);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return [lat, lng];
    }
  }
  
  return null;
}

// Component to center map on idle machinery when needed
function CenterOnIdleMachinery({ hasIdleMachinery }: { hasIdleMachinery: boolean }) {
  const map = useMap();
  
  useEffect(() => {
    if (hasIdleMachinery) {
      map.setView(IDLE_MACHINERY_COORDS, 15);
    }
  }, [hasIdleMachinery, map]);
  
  return null;
}

// Component to center map on a specific working site
function CenterOnWorkingSite({ 
  workingSiteName, 
  workingSites 
}: { 
  workingSiteName: string | null; 
  workingSites: WorkingSite[];
}) {
  const map = useMap();
  
  useEffect(() => {
    if (workingSiteName) {
      const site = workingSites.find(
        (s) => s.workingSiteName.toLowerCase().includes(workingSiteName.toLowerCase())
      );
      
      if (site) {
        let coords: [number, number] | null = null;
        
        // Try to get coordinates from the site
        if (site.latitude && site.longitude) {
          const lat = parseFloat(site.latitude);
          const lon = parseFloat(site.longitude);
          if (!isNaN(lat) && !isNaN(lon)) {
            coords = [lat, lon];
          }
        }
        
        // Fallback: try to parse location string
        if (!coords && site.location) {
          const parsed = parseLocation(site.location);
          if (parsed) {
            coords = parsed;
          }
        }
        
        if (coords) {
          map.setView(coords, 15);
          console.log(`[CenterOnWorkingSite] Centered on ${site.workingSiteName} at ${coords[0]}, ${coords[1]}`);
        } else {
          console.warn(`[CenterOnWorkingSite] No coordinates found for ${site.workingSiteName}`);
        }
      }
    }
  }, [workingSiteName, workingSites, map]);
  
  return null;
}

// Single operation marker component - memoized for stability
const OperationMarker = memo(function OperationMarker({
  position,
  type,
  operation,
}: {
  position: [number, number];
  type: 'internal' | 'outsource';
  operation: InternalOperation | OutsourceOperation;
}) {
  // Internal operations use red icon, outsource operations use blue icon
  const icon = type === 'internal' ? redIcon : blueIcon;
  const operationType = type === 'internal' ? 'Internal' : 'Outsource';
  const machineNumber = 'machineNumber' in operation ? operation.machineNumber : null;
  const machineCode = 'machineCode' in operation ? operation.machineCode : null;
  
  return (
    <Marker position={position} icon={icon}>
      <Popup>
        <div>
          <strong>{operationType} Operation</strong>
          <br />
          Machine: {machineNumber || machineCode || 'N/A'}
          <br />
          Site: {operation.workingSiteName || 'N/A'}
          <br />
          Start: {operation.startDate ? formatDateDDMMYYYY(operation.startDate) : 'N/A'}
        </div>
      </Popup>
    </Marker>
  );
});

// Idle machinery marker component - memoized for stability
const IdleMachineryMarker = memo(function IdleMachineryMarker({
  position,
  machine,
  internalOps,
  outsourceOps,
  workingSites,
}: {
  position: [number, number];
  machine: { 
    id?: string; 
    machineNumber: string; 
    machineCode: string; 
    status?: string | null;
    createdAt?: string;
    latitude?: string | null;
    longitude?: string | null;
  };
  internalOps: InternalOperation[];
  outsourceOps: OutsourceOperation[];
  workingSites: WorkingSite[];
}) {
  const status = String(machine.status || '').trim().toUpperCase();
  const isIdle = status === 'IDLE' || status === '';
  const isActive = status === 'ACTIVE';
  
  const idleDate = useMemo(() => {
    if (!machine.createdAt) return 'N/A';
    try {
      return formatDateDDMMYYYY(machine.createdAt);
    } catch {
      return 'N/A';
    }
  }, [machine.createdAt]);
  
  // Find working site for ACTIVE machinery
  const workingSiteInfo = useMemo(() => {
    if (!isActive) return null;
    
    // Find operation for this machinery
    const operation = 
      internalOps.find(op => op.machineNumber === machine.machineNumber) ||
      outsourceOps.find(op => op.machineCode === machine.machineCode);
    
    if (operation && operation.workingSiteName) {
      // Find working site details
      const site = workingSites.find(s => s.workingSiteName === operation.workingSiteName);
      if (site) {
        return {
          name: site.workingSiteName,
          location: site.location || 'N/A',
        };
      }
      return {
        name: operation.workingSiteName,
        location: 'N/A',
      };
    }
    return null;
  }, [isActive, machine.machineNumber, machine.machineCode, internalOps, outsourceOps, workingSites]);
  
  // Determine location text
  const locationText = useMemo(() => {
    if (isActive) {
      if (workingSiteInfo) {
        return `${workingSiteInfo.name} - ${workingSiteInfo.location}`;
      }
      if (machine.latitude && machine.longitude) {
        const lat = parseFloat(String(machine.latitude));
        const lon = parseFloat(String(machine.longitude));
        if (!isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0) {
          return `Coordinates: ${lat.toFixed(6)}, ${lon.toFixed(6)}`;
        }
      }
      return 'Location not available';
    }
    return IDLE_MACHINERY_ADDRESS;
  }, [isActive, workingSiteInfo, machine.latitude, machine.longitude]);
  
  return (
    <Marker position={position} icon={idleIcon}>
      <Tooltip permanent={false}>
        <div>
          <strong>{machine.machineNumber}</strong>
          <br />
          {isIdle ? `Idle since: ${idleDate}` : `Status: ${status}`}
        </div>
      </Tooltip>
      <Popup>
        <div>
          <strong>{isIdle ? 'Idle Machinery' : 'Active Machinery'}</strong>
          <br />
          Machine Number: {machine.machineNumber}
          <br />
          Machine Code: {machine.machineCode}
          <br />
          Status: {status || 'IDLE'}
          <br />
          {isIdle ? `Idle since: ${idleDate}` : 'Currently Active'}
          <br />
          Location: {locationText}
        </div>
      </Popup>
    </Marker>
  );
});

// Working site marker component - memoized for stability
const WorkingSiteMarker = memo(function WorkingSiteMarker({
  site,
}: {
  site: WorkingSite;
}) {
  const coords = useMemo(() => {
    // Use coordinates if available
    if (site.latitude && site.longitude) {
      const lat = parseFloat(site.latitude);
      const lon = parseFloat(site.longitude);
      if (!isNaN(lat) && !isNaN(lon)) {
        return [lat, lon] as [number, number];
      }
    }
    // Fallback: try to parse location string
    const parsed = parseLocation(site.location || '');
    return parsed || DEFAULT_CENTER;
  }, [site.location, site.latitude, site.longitude]);
  
  return (
    <Marker position={coords} icon={DefaultIcon}>
      <Popup>
        <div>
          <strong>{site.workingSiteName}</strong>
          <br />
          Location: {site.location || 'N/A'}
        </div>
      </Popup>
    </Marker>
  );
});

// Main map markers component - handles all marker rendering
function MapMarkers({
  internalOps,
  outsourceOps,
  workingSites,
  activeMachinery,
}: {
  internalOps: InternalOperation[];
  outsourceOps: OutsourceOperation[];
  workingSites: WorkingSite[];
  activeMachinery?: Array<{
    id?: string;
    machineNumber: string;
    machineCode: string;
    status: string;
    latitude?: string | null;
    longitude?: string | null;
    createdAt?: string;
  }>;
}) {
  // Group operations by location (from working sites)
  const operationMarkers = useMemo(() => {
    const markers: React.ReactElement[] = [];
    const locationMap = new Map<string, Array<{ type: 'internal' | 'outsource'; op: InternalOperation | OutsourceOperation }>>();
    
    // Create a map of working site names to coordinates
    const siteCoordsMap = new Map<string, [number, number]>();
    console.log(`[MapMarkers] Processing ${workingSites.length} working sites`);
    workingSites.forEach((site) => {
      if (site.workingSiteName) {
        // Use coordinates if available, otherwise try to parse location string
        if (site.latitude && site.longitude) {
          const lat = parseFloat(site.latitude);
          const lon = parseFloat(site.longitude);
          if (!isNaN(lat) && !isNaN(lon)) {
            siteCoordsMap.set(site.workingSiteName, [lat, lon]);
            console.log(`[MapMarkers] Added working site "${site.workingSiteName}" with coordinates [${lat}, ${lon}]`);
          }
        } else if (site.location) {
          // Fallback: try to parse location string as coordinates
          const coords = parseLocation(site.location);
          if (coords) {
            siteCoordsMap.set(site.workingSiteName, coords);
            console.log(`[MapMarkers] Added working site "${site.workingSiteName}" with parsed coordinates [${coords[0]}, ${coords[1]}]`);
          } else {
            console.warn(`[MapMarkers] Working site "${site.workingSiteName}" has location "${site.location}" but couldn't parse as coordinates`);
          }
        } else {
          console.warn(`[MapMarkers] Working site "${site.workingSiteName}" has no latitude/longitude or location string`);
        }
      }
    });
    console.log(`[MapMarkers] Created siteCoordsMap with ${siteCoordsMap.size} entries`);
    
    // Group internal operations by their working site coordinates
    // Only show operations without endDate (active operations)
    const activeInternalOps = internalOps.filter(op => !op.endDate || op.endDate === '');
    console.log(`[MapMarkers] Processing ${activeInternalOps.length} active internal operations`);
    
    activeInternalOps.forEach((op) => {
      if (!op.workingSiteName) {
        console.warn(`[MapMarkers] Internal operation ${op.id} has no workingSiteName, skipping`);
        return;
      }
      const coords = siteCoordsMap.get(op.workingSiteName);
      if (!coords) {
        console.warn(`[MapMarkers] Internal operation ${op.id} has workingSiteName "${op.workingSiteName}" but no coordinates found in working sites`);
        return;
      }
    
      const coordsKey = `${coords[0]},${coords[1]}`;
      if (!locationMap.has(coordsKey)) {
        locationMap.set(coordsKey, []);
      }
      locationMap.get(coordsKey)!.push({ type: 'internal', op });
      console.log(`[MapMarkers] Added internal operation ${op.id} at ${coordsKey}`);
    });
    
    // Group outsource operations by their working site coordinates
    // Only show operations without endDate (active operations)
    const activeOutsourceOps = outsourceOps.filter(op => !op.endDate || op.endDate === '');
    console.log(`[MapMarkers] Processing ${activeOutsourceOps.length} active outsource operations`);
    
    activeOutsourceOps.forEach((op) => {
      if (!op.workingSiteName) {
        console.warn(`[MapMarkers] Outsource operation ${op.id} has no workingSiteName, skipping`);
        return;
      }
      const coords = siteCoordsMap.get(op.workingSiteName);
      if (!coords) {
        console.warn(`[MapMarkers] Outsource operation ${op.id} has workingSiteName "${op.workingSiteName}" but no coordinates found in working sites`);
        return;
      }
    
      const coordsKey = `${coords[0]},${coords[1]}`;
      if (!locationMap.has(coordsKey)) {
        locationMap.set(coordsKey, []);
      }
      locationMap.get(coordsKey)!.push({ type: 'outsource', op });
      console.log(`[MapMarkers] Added outsource operation ${op.id} at ${coordsKey}`);
    });
    
    // Create markers with offsets
    locationMap.forEach((ops, coordsKey) => {
      const coords = parseLocation(coordsKey);
      if (!coords) {
        console.warn(`[MapMarkers] Could not parse coordsKey "${coordsKey}"`);
        return;
      }
      
      console.log(`[MapMarkers] Creating ${ops.length} markers at ${coordsKey} (${ops.filter(o => o.type === 'internal').length} internal, ${ops.filter(o => o.type === 'outsource').length} outsource)`);
      
      ops.forEach((opWithType, index) => {
        const offsetCoords = offsetMarkerPosition(coords, index, ops.length);
        const key = `${opWithType.type}-${opWithType.op.id || index}-${coordsKey}`;
        markers.push(
          <OperationMarker
            key={key}
            position={offsetCoords}
            type={opWithType.type}
            operation={opWithType.op}
          />
        );
      });
    });
    
    console.log(`[MapMarkers] Created ${markers.length} operation markers total`);
    return markers;
  }, [internalOps, outsourceOps, workingSites]);
  
  // Create machinery markers for IDLE machinery and ACTIVE machinery without operations
  const machineryMarkers = useMemo(() => {
    if (!activeMachinery || activeMachinery.length === 0) return [];
    
    // Get machine numbers that are in active operations (without endDate) to avoid duplicates
    const activeMachineNumbers = new Set<string>();
    internalOps
      .filter(op => !op.endDate || op.endDate === '')
      .forEach(op => {
        if (op.machineNumber) activeMachineNumbers.add(op.machineNumber);
      });
    outsourceOps
      .filter(op => !op.endDate || op.endDate === '')
      .forEach(op => {
      if (op.machineCode) {
        // Find machinery by machine code
        const machinery = activeMachinery.find(m => m.machineCode === op.machineCode);
        if (machinery) activeMachineNumbers.add(machinery.machineNumber);
      }
    });
    
    // Filter machinery: show IDLE machinery and ACTIVE machinery that's NOT in an operation
    const machineryToShow = activeMachinery.filter((machine) => {
      const status = String(machine.status || '').trim().toUpperCase();
      const isActive = status === 'ACTIVE';
      const isInOperation = activeMachineNumbers.has(machine.machineNumber);
      
      // Show IDLE machinery that's not in an operation
      if (status !== 'ACTIVE' && !isInOperation) return true;
      
      // Show ACTIVE machinery that's NOT in an operation (no operation marker exists)
      if (isActive && !isInOperation) return true;
      
      return false;
    });
    
    if (machineryToShow.length === 0) return [];
    
    
    const markers: React.ReactElement[] = [];
    const locationGroups = new Map<string, Array<typeof activeMachinery[0]>>();
    
    // Group machinery by location
    machineryToShow.forEach((machine) => {
      
      const status = String(machine.status || '').trim().toUpperCase();
      const isActive = status === 'ACTIVE';
      let coordsKey: string;
      let baseCoords: [number, number];
      
      // For ACTIVE machinery, try to find coordinates from working site first
      if (isActive) {
        // Find operation for this machinery to get working site
        const operation = 
          internalOps.find(op => op.machineNumber === machine.machineNumber && (!op.endDate || op.endDate === '')) ||
          outsourceOps.find(op => op.machineCode === machine.machineCode && (!op.endDate || op.endDate === ''));
        
        if (operation && operation.workingSiteName) {
          // Find working site coordinates
          const site = workingSites.find(s => s.workingSiteName === operation.workingSiteName);
          if (site) {
            if (site.latitude && site.longitude) {
              const lat = parseFloat(site.latitude);
              const lon = parseFloat(site.longitude);
              if (!isNaN(lat) && !isNaN(lon)) {
                baseCoords = [lat, lon];
                coordsKey = `${lat},${lon}`;
              } else {
                // Try parsing location string
                const parsed = parseLocation(site.location || '');
                if (parsed) {
                  baseCoords = parsed;
                  coordsKey = `${parsed[0]},${parsed[1]}`;
                } else {
                  baseCoords = IDLE_MACHINERY_COORDS;
                  coordsKey = `${IDLE_MACHINERY_COORDS[0]},${IDLE_MACHINERY_COORDS[1]}`;
                }
              }
            } else {
              // Try parsing location string
              const parsed = parseLocation(site.location || '');
              if (parsed) {
                baseCoords = parsed;
                coordsKey = `${parsed[0]},${parsed[1]}`;
              } else {
                baseCoords = IDLE_MACHINERY_COORDS;
                coordsKey = `${IDLE_MACHINERY_COORDS[0]},${IDLE_MACHINERY_COORDS[1]}`;
              }
            }
          } else {
            // No site found, use machinery coordinates or garage
            if (machine.latitude && machine.longitude) {
              const lat = parseFloat(String(machine.latitude));
              const lon = parseFloat(String(machine.longitude));
              if (!isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0) {
                baseCoords = [lat, lon];
                coordsKey = `${lat},${lon}`;
              } else {
                baseCoords = IDLE_MACHINERY_COORDS;
                coordsKey = `${IDLE_MACHINERY_COORDS[0]},${IDLE_MACHINERY_COORDS[1]}`;
              }
            } else {
              baseCoords = IDLE_MACHINERY_COORDS;
              coordsKey = `${IDLE_MACHINERY_COORDS[0]},${IDLE_MACHINERY_COORDS[1]}`;
            }
          }
        } else {
          // No operation found, use machinery coordinates or garage
          if (machine.latitude && machine.longitude) {
            const lat = parseFloat(String(machine.latitude));
            const lon = parseFloat(String(machine.longitude));
            if (!isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0) {
              baseCoords = [lat, lon];
              coordsKey = `${lat},${lon}`;
            } else {
              baseCoords = IDLE_MACHINERY_COORDS;
              coordsKey = `${IDLE_MACHINERY_COORDS[0]},${IDLE_MACHINERY_COORDS[1]}`;
            }
          } else {
            baseCoords = IDLE_MACHINERY_COORDS;
            coordsKey = `${IDLE_MACHINERY_COORDS[0]},${IDLE_MACHINERY_COORDS[1]}`;
          }
        }
      } else {
        // IDLE machinery - use machinery coordinates if available, otherwise garage
        if (machine.latitude && machine.longitude) {
          const lat = parseFloat(String(machine.latitude));
          const lon = parseFloat(String(machine.longitude));
          if (!isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0) {
            baseCoords = [lat, lon];
            coordsKey = `${lat},${lon}`;
          } else {
            // Invalid coordinates - use garage for idle machinery
            baseCoords = IDLE_MACHINERY_COORDS;
            coordsKey = `${IDLE_MACHINERY_COORDS[0]},${IDLE_MACHINERY_COORDS[1]}`;
          }
        } else {
          // No coordinates - use garage location for idle machinery
          baseCoords = IDLE_MACHINERY_COORDS;
          coordsKey = `${IDLE_MACHINERY_COORDS[0]},${IDLE_MACHINERY_COORDS[1]}`;
        }
      }
      
      if (!locationGroups.has(coordsKey)) {
        locationGroups.set(coordsKey, []);
      }
      locationGroups.get(coordsKey)!.push(machine);
    });
    
    // Create markers with offsets for each location group
    locationGroups.forEach((machines, coordsKey) => {
      const [lat, lon] = coordsKey.split(',').map(Number);
      const baseCoords: [number, number] = [lat, lon];
      
      machines.forEach((machine, index) => {
        const offsetCoords = offsetMarkerPosition(baseCoords, index, machines.length);
        const key = `machinery-${machine.id || machine.machineNumber || index}`;
        
        markers.push(
          <IdleMachineryMarker
            key={key}
            position={offsetCoords}
            machine={machine}
            internalOps={internalOps}
            outsourceOps={outsourceOps}
            workingSites={workingSites}
          />
        );
      });
    });
    
    return markers;
  }, [activeMachinery, internalOps, outsourceOps, workingSites]);
  
  // Create working site markers
  const siteMarkers = useMemo(() => {
    return workingSites.map((site) => (
      <WorkingSiteMarker key={`site-${site.id}`} site={site} />
    ));
  }, [workingSites]);
  
  return (
    <>
      {operationMarkers}
      {machineryMarkers}
      {/* Working site markers removed - only show machinery locations */}
    </>
  );
}

// Props type
type MachineryMapProps = {
  machineNumber?: string;
  machineCode?: string;
  internalOps: InternalOperation[];
  outsourceOps: OutsourceOperation[];
  workingSites: WorkingSite[];
  machineryStatus?: string | null;
  showAllActive?: boolean;
  activeMachinery?: Array<{
    id?: string;
    machineNumber: string;
    machineCode: string;
    status: string;
    latitude?: string | null;
    longitude?: string | null;
    createdAt?: string;
  }>;
  hideLegend?: boolean;
  selectedWorkingSite?: string | null;
};

// Main component
export function MachineryMap({
  internalOps,
  outsourceOps,
  workingSites,
  machineryStatus,
  showAllActive = false,
  activeMachinery = [],
  hideLegend = false,
  selectedWorkingSite = null,
}: MachineryMapProps) {
  const [isClient, setIsClient] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredWorkingSites, setFilteredWorkingSites] = useState<WorkingSite[]>([]);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Filter working sites based on search query
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = workingSites.filter((site) =>
        site.workingSiteName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredWorkingSites(filtered);
    } else {
      setFilteredWorkingSites([]);
    }
  }, [searchQuery, workingSites]);
  
  // Use selectedWorkingSite prop if provided, otherwise use search query
  const activeWorkingSiteName = selectedWorkingSite || (filteredWorkingSites.length === 1 ? filteredWorkingSites[0].workingSiteName : null);
  
  // Determine map center and zoom - memoized for stability
  const mapCenter = useMemo(() => {
    // If a working site is selected, center on it
    if (activeWorkingSiteName) {
      const site = workingSites.find(
        (s) => s.workingSiteName.toLowerCase().includes(activeWorkingSiteName.toLowerCase())
      );
      if (site) {
        if (site.latitude && site.longitude) {
          const lat = parseFloat(site.latitude);
          const lon = parseFloat(site.longitude);
          if (!isNaN(lat) && !isNaN(lon)) {
            return [lat, lon] as [number, number];
          }
        }
        // Fallback: try to parse location string
        const parsed = parseLocation(site.location || '');
        if (parsed) {
          return parsed;
        }
      }
    }
    
    if (activeMachinery && activeMachinery.length > 0) {
      // Find first machinery with coordinates, or use garage
      const machineryWithCoords = activeMachinery.find(
        (m) => m.latitude && m.longitude && !isNaN(parseFloat(m.latitude)) && !isNaN(parseFloat(m.longitude))
      );
      if (machineryWithCoords) {
        return [parseFloat(machineryWithCoords.latitude!), parseFloat(machineryWithCoords.longitude!)] as [number, number];
      }
      return IDLE_MACHINERY_COORDS;
    }
    return DEFAULT_CENTER;
  }, [activeMachinery, activeWorkingSiteName, workingSites]);
  
  const mapZoom = useMemo(() => {
    // If a working site is selected, zoom in closer
    if (activeWorkingSiteName) {
      return 15;
    }
    if (activeMachinery && activeMachinery.length > 0) {
      return 13;
    }
    return DEFAULT_ZOOM;
  }, [activeMachinery, activeWorkingSiteName]);
  
  // If showing single machinery and it's not active, show message
  if (!showAllActive && machineryStatus && machineryStatus !== 'Active') {
    return (
      <div className={styles.mapContainer}>
        <div className={styles.noDataMessage}>
          Map is only available for active machinery. Current status: {machineryStatus}
        </div>
      </div>
    );
  }
  
  if (!isClient) {
    return (
      <div className={styles.mapContainer}>
        <div className={styles.noDataMessage}>Loading map...</div>
      </div>
    );
  }
  
  return (
    <div className={styles.mapContainer}>
      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search working site by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
        {filteredWorkingSites.length > 1 && (
          <div className={styles.searchResults}>
            {filteredWorkingSites.map((site) => (
              <button
                key={site.id}
                type="button"
                className={styles.searchResultItem}
                onClick={() => {
                  setSearchQuery(site.workingSiteName);
                  setFilteredWorkingSites([site]);
                }}
              >
                {site.workingSiteName}
              </button>
            ))}
          </div>
        )}
      </div>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <CenterOnIdleMachinery hasIdleMachinery={activeMachinery && activeMachinery.length > 0 && !activeWorkingSiteName} />
        <CenterOnWorkingSite workingSiteName={activeWorkingSiteName} workingSites={workingSites} />
        
        <MapMarkers
          internalOps={internalOps}
          outsourceOps={outsourceOps}
          workingSites={workingSites}
          activeMachinery={activeMachinery}
        />
        
        {!hideLegend && (
          <div className={styles.legend}>
            {(internalOps.length > 0 || outsourceOps.length > 0) && (
              <>
                {internalOps.length > 0 && (
                  <div className={styles.legendItem}>
                    <div className={styles.legendColor} style={{ backgroundColor: '#ef4444' }}></div>
                    <span>Internal Operations</span>
                  </div>
                )}
                {outsourceOps.length > 0 && (
                  <div className={styles.legendItem}>
                    <div className={styles.legendColor} style={{ backgroundColor: '#3b82f6' }}></div>
                    <span>Outsource Operations</span>
                  </div>
                )}
              </>
            )}
            {activeMachinery && activeMachinery.length > 0 && (
              <div className={styles.legendItem}>
                <div className={styles.legendColor} style={{ backgroundColor: '#f97316' }}></div>
                <span>Machinery</span>
              </div>
            )}
          </div>
        )}
      </MapContainer>
    </div>
  );
}
