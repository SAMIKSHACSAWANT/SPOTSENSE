import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPinIcon, ArrowRightIcon, ClockIcon, TruckIcon } from '@heroicons/react/24/outline';
import { Card, Button, Loading } from '../components/common';
import { toast } from 'react-toastify';

const HomePage = () => {
  const [location, setLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [nearbyParkingSpots, setNearbyParkingSpots] = useState([]);
  const [loadingParkings, setLoadingParkings] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setIsLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Use default location if geolocation fails
          setLocation({ lat: 19.1266816, lng: 72.8662016 });
          setIsLoading(false);
        }
      );
    } else {
      // Geolocation not supported by browser
      console.warn('Geolocation is not supported by this browser');
      setLocation({ lat: 19.1266816, lng: 72.8662016 });
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (location) {
      // In a real app, this would fetch data from an API
      // For now, we'll use mock data
      const mockData = [
        {
          id: 'andheri_metro',
          name: 'Andheri Metro Station Parking',
          address: 'Western Express Highway, Andheri East, Mumbai',
          availableSpots: 23,
          totalSpots: 60,
          distance: '0.5 km',
          hours: '4:30 AM - 12:30 AM',
          rate: '₹40/hour',
        },
        {
          id: 'marol_parking',
          name: 'Marol MIDC Parking Complex',
          address: 'Marol MIDC, Andheri East, Mumbai',
          availableSpots: 15,
          totalSpots: 45,
          distance: '1.2 km',
          hours: 'Open 24 hours',
          rate: '₹35/hour',
        },
        {
          id: 'infiniti_mall',
          name: 'Infiniti Mall Parking',
          address: 'New Link Road, Andheri West, Mumbai',
          availableSpots: 32,
          totalSpots: 100,
          distance: '2.5 km',
          hours: '10 AM - 10 PM',
          rate: '₹50/hour',
        },
        {
          id: 'rcity_mall',
          name: 'R City Mall Parking',
          address: 'LBS Marg, Ghatkopar West, Mumbai',
          availableSpots: 28,
          totalSpots: 69,
          distance: '3.8 km',
          hours: 'Open 24 hours',
          rate: '₹40/hour',
        },
      ];

      setNearbyParkingSpots(mockData);
    }
  }, [location]);

  const handleBookParking = (parkingId) => {
    // Find the parking spot with the matching ID
    const selectedSpot = nearbyParkingSpots.find(spot => spot.id === parkingId);
    
    // Navigate with the state containing parking details
    navigate(`/parking/${parkingId}`, {
      state: {
        parkingDetails: {
          id: selectedSpot.id,
          name: selectedSpot.name,
          address: selectedSpot.address,
          coordinates: [19.1367, 72.8296], // Placeholder coordinates
          hours: selectedSpot.hours,
          operatingTime: selectedSpot.hours,
          hourlyRate: selectedSpot.rate,
          available: selectedSpot.availableSpots,
          features: "CCTV, Security, Covered Parking",
          type: "mall"
        }
      }
    });
  };

  const refreshLocation = () => {
    setIsLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setIsLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsLoading(false);
        }
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <Loading size="lg" />
        <p className="mt-4 text-neutral-600 dark:text-neutral-400">Getting your location...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white mb-2">
          SpotSense
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
          Find and book parking spots near you in seconds
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
              Nearby Parking Spots
            </h2>
            <button
              onClick={refreshLocation}
              className="text-yellow-500 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300"
            >
              Refresh Location
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nearbyParkingSpots.map((spot) => (
              <div
                key={spot.id}
                className="bg-white dark:bg-neutral-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden"
              >
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                    {spot.name}
                  </h3>
                  <div className="flex items-start mb-3">
                    <MapPinIcon className="h-5 w-5 text-neutral-500 dark:text-neutral-400 mr-2 mt-0.5 flex-shrink-0" />
                    <p className="text-neutral-600 dark:text-neutral-300 text-sm">
                      {spot.address}
                    </p>
                  </div>
                  
                  <div className="flex justify-between mb-4">
                    <div className="flex items-center">
                      <TruckIcon className="h-5 w-5 text-neutral-500 dark:text-neutral-400 mr-2" />
                      <span className="text-sm text-neutral-800 dark:text-neutral-200">
                        <span className="font-medium text-yellow-600 dark:text-yellow-400">
                          {spot.availableSpots}
                        </span>
                        /{spot.totalSpots} spots
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs bg-neutral-100 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-300 px-2 py-1 rounded">
                        {spot.distance}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-5 gap-1 mb-4">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div 
                        key={i}
                        className={`h-3 rounded-sm ${
                          i < spot.availableSpots / spot.totalSpots * 10
                            ? 'bg-green-400'
                            : 'bg-neutral-200 dark:bg-neutral-600'
                        }`}
                      />
                    ))}
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 text-neutral-500 dark:text-neutral-400 mr-1" />
                      <span className="text-xs text-neutral-600 dark:text-neutral-400">
                        {spot.hours}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                      {spot.rate}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleBookParking(spot.id)}
                    className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-medium py-2 px-4 rounded transition-colors duration-300"
                    title="Choose a specific parking slot"
                  >
                    Book Now
                  </button>
                  <button
                    onClick={() => navigate(`/parking-detail/${spot.id}`)}
                    className="w-full bg-transparent text-yellow-500 hover:text-yellow-600 font-medium py-2 mt-2 text-sm"
                    title="View information, amenities and facility details"
                  >
                    View Details
                  </button>
                  <div className="flex justify-between mt-2 text-xs text-neutral-500">
                    <span>Choose a specific slot</span>
                    <span>View facility info</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Mobile Navigation Dots */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center md:hidden">
        <div className="bg-black/70 rounded-full px-4 py-2 flex space-x-2">
          <div className="h-2 w-2 rounded-full bg-yellow-400"></div>
          <div className="h-2 w-2 rounded-full bg-white/40"></div>
          <div className="h-2 w-2 rounded-full bg-white/40"></div>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 