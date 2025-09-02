import { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Phone, Clock, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface GoogleMapProps {
  latitude: number;
  longitude: number;
  shopName: string;
  address: string;
  phone: string;
  hours: string;
}

const GoogleMap = ({ latitude, longitude, shopName, address, phone, hours }: GoogleMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const initializeMap = useCallback(() => {
    try {
      if (!mapRef.current || !window.google) {
        setMapError('Google Maps not available');
        return;
      }

      // Clear previous map instance
      if (mapInstanceRef.current) {
        mapInstanceRef.current = null;
      }

      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: { lat: latitude, lng: longitude },
        zoom: 16,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        styles: [
          {
            featureType: 'poi.business',
            stylers: [{ visibility: 'on' }]
          },
          {
            featureType: 'transit',
            elementType: 'labels.icon',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      mapInstanceRef.current = mapInstance;

      // Add marker
      const marker = new window.google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map: mapInstance,
        title: shopName,
        animation: google.maps.Animation.DROP,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="20" fill="#3B82F6"/>
              <circle cx="20" cy="20" r="8" fill="white"/>
              <circle cx="20" cy="20" r="4" fill="#3B82F6"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(40, 40),
          anchor: new google.maps.Point(20, 20)
        }
      });

      markerRef.current = marker;

      // Add info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 10px; max-width: 250px;">
            <h3 style="margin: 0 0 8px 0; color: #1F2937; font-weight: 600;">${shopName}</h3>
            <p style="margin: 0 0 5px 0; color: #6B7280; font-size: 14px;">${address}</p>
            <p style="margin: 0; color: #6B7280; font-size: 14px;">${phone}</p>
          </div>
        `
      });

      infoWindowRef.current = infoWindow;

      marker.addListener('click', () => {
        infoWindow.open(mapInstance, marker);
      });

      setIsMapLoaded(true);
      setMapError(null);
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError('Failed to load map');
      setIsMapLoaded(false);
    }
  }, [latitude, longitude, shopName, address, phone]);

  useEffect(() => {
    let scriptElement: HTMLScriptElement | null = null;
    let isMounted = true;

    const loadGoogleMapsScript = () => {
      if (!isMounted) return;

      if (window.google && window.google.maps) {
        initializeMap();
        return;
      }

      // Check if script is already loading
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        const handleLoad = () => {
          if (isMounted) {
            initializeMap();
          }
        };
        existingScript.addEventListener('load', handleLoad);
        return () => existingScript?.removeEventListener('load', handleLoad);
      }

      scriptElement = document.createElement('script');
      scriptElement.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      scriptElement.async = true;
      scriptElement.defer = true;
      
      const handleLoad = () => {
        if (isMounted) {
          initializeMap();
        }
      };
      
      const handleError = () => {
        if (isMounted) {
          setMapError('Failed to load Google Maps');
          setIsMapLoaded(false);
        }
      };

      scriptElement.addEventListener('load', handleLoad);
      scriptElement.addEventListener('error', handleError);
      
      // Safely append to head
      try {
        document.head.appendChild(scriptElement);
      } catch (error) {
        console.error('Error appending script:', error);
        setMapError('Failed to load Google Maps');
        setIsMapLoaded(false);
      }
    };

    loadGoogleMapsScript();

    return () => {
      isMounted = false;
      
      // Cleanup script
      if (scriptElement && scriptElement.parentNode) {
        try {
          scriptElement.parentNode.removeChild(scriptElement);
        } catch (error) {
          console.warn('Error removing script:', error);
        }
      }
      
      // Clear map references
      if (markerRef.current) {
        try {
          markerRef.current.setMap(null);
        } catch (error) {
          console.warn('Error clearing marker:', error);
        }
        markerRef.current = null;
      }
      
      if (infoWindowRef.current) {
        try {
          infoWindowRef.current.close();
        } catch (error) {
          console.warn('Error closing info window:', error);
        }
        infoWindowRef.current = null;
      }
      
      if (mapInstanceRef.current) {
        mapInstanceRef.current = null;
      }
    };
  }, [initializeMap, GOOGLE_MAPS_API_KEY]);

  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    window.open(url, '_blank');
  };

  const openInAppleMaps = () => {
    const url = `http://maps.apple.com/?daddr=${latitude},${longitude}`;
    window.open(url, '_blank');
  };

  return (
    <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Find Our Location
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Visit our authorized E-Mitra center for all your government services
          </p>
        </div>

         <div className="flex flex-col lg:flex-row gap-8">
          
          {/* <div className="lg:col-span-2">
            <Card className="overflow-hidden shadow-2xl border-0">
              <CardContent className="p-0">
                <div 
                   ref={mapRef}
                   className="w-full h-[400px] md:h-[500px] bg-gray-200 relative"
                 >
                   {!isMapLoaded && !mapError && (
                     <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                       <div className="text-center">
                         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                         <p className="text-gray-600">Loading map...</p>
                       </div>
                     </div>
                   )}
                   {mapError && (
                     <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                       <div className="text-center">
                         <div className="text-red-500 mb-4">
                           <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                           </svg>
                         </div>
                         <p className="text-gray-600 mb-2">Map loading failed</p>
                         <p className="text-sm text-gray-500">{mapError}</p>
                         <button 
                           onClick={() => {
                             setMapError(null);
                             setIsMapLoaded(false);
                             initializeMap();
                           }}
                           className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                         >
                           Retry
                         </button>
                       </div>
                     </div>
                   )}
                 </div>
              </CardContent>
            </Card>
          </div> */}

          <div className="w-full lg:w-2/3">
            <div className="w-full h-[300px] sm:h-[400px] md:h-[500px] rounded-xl overflow-hidden shadow-xl">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3593.7196031979474!2d71.39411987523034!3d25.746784677361163!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39443b007750dead%3A0x57460a770747e6a0!2sMalani%20Mobile%20and%20Electronics%20Barmer!5e0!3m2!1sen!2sin!4v1756790030430!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>

          {/* Location Details */}
          <div className="space-y-6">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <MapPin className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {shopName}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {address}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-semibold text-gray-900">{phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-sm text-gray-500">Business Hours</p>
                      <p className="font-semibold text-gray-900">{hours}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <Card className="shadow-xl border-0 bg-gradient-to-r from-blue-600 to-indigo-600">
              <CardContent className="p-6">
                <h4 className="text-white font-semibold mb-4 text-lg">
                  Get Directions
                </h4>
                <div className="space-y-3">
                  <Button 
                    onClick={openInGoogleMaps}
                    className="w-full bg-white text-blue-600 hover:bg-gray-100 font-semibold"
                    size="lg"
                  >
                    <Navigation className="h-5 w-5 mr-2" />
                    Open in Google Maps
                  </Button>
                  <Button 
                    onClick={openInAppleMaps}
                    variant="outline" 
                    className="w-full bg-[conic-gradient(at_right,_var(--tw-gradient-stops))] from-[#9ca3af] via-[#4b5563] to-[#1e40af] text-white hover:bg-white/10"
                    size="lg"
                  >
                    <Navigation className="h-5 w-5 mr-2" />
                    Open in Apple Maps
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Contact */}
            <Card className="shadow-xl border-0 bg-gradient-to-r from-green-600 to-emerald-600">
              <CardContent className="p-6">
                <h4 className="text-white font-semibold mb-4 text-lg">
                  Need Help?
                </h4>
                <p className="text-green-100 mb-4">
                  Call us directly for immediate assistance with your services
                </p>
                <Button 
                  className="w-full bg-white text-green-600 hover:bg-gray-100 font-semibold"
                  size="lg"
                  onClick={() => window.location.href = `tel:${phone}`}
                >
                  <Phone className="h-5 w-5 mr-2" />
                  Call Now
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GoogleMap;
