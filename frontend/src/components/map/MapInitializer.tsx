import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

export function MapInitializer() {
  const map = useMap();

  useEffect(() => {
    // Wait for map container to be ready before invalidating size
    const invalidateWhenReady = () => {
      try {
        // Check if map container exists and is in the DOM
        const container = map.getContainer();
        if (container && container.parentElement) {
          map.invalidateSize();
        } else {
          // Retry after a short delay if container isn't ready
          setTimeout(invalidateWhenReady, 50);
        }
      } catch (error) {
        // Silently handle errors - map might not be fully initialized
        console.debug('Map initialization error (non-critical):', error);
      }
    };

    // Initial delay to ensure DOM is ready
    const timeoutId = setTimeout(invalidateWhenReady, 150);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [map]);

  return null;
}


