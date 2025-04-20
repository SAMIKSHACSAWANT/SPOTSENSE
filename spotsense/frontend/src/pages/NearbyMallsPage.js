import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPinIcon, 
  ArrowRightIcon, 
  MagnifyingGlassIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline';
import { Card, Button, Loading } from '../components/common';
import axios from 'axios';

const libraries = ['places'];

const AndheriParkingPage = () => {
  const navigate = useNavigate();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [nearbyMalls, setNearbyMalls] = useState([]);
  const [selectedMall, setSelectedMall] = useState(null);
  const [searchRadius, setSearchRadius] = useState(3000); // 3km default radius
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation(location);
          setIsLoading(false);
          
          // Once we have location, search for nearby malls
          searchNearbyMalls(location, searchRadius);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Default to Mumbai location
          const defaultLocation = { lat: 19.0760, lng: 72.8777 };
          setCurrentLocation(defaultLocation);
          setIsLoading(false);
          
          // Search with default location
          searchNearbyMalls(defaultLocation, searchRadius);
        }
      );
    } else {
      console.warn('Geolocation is not supported by this browser');
      // Default to Mumbai location
      const defaultLocation = { lat: 19.0760, lng: 72.8777 };
      setCurrentLocation(defaultLocation);
      setIsLoading(false);
    }
  }, []);

  const searchNearbyMalls = async (location, radius) => {
    setIsLoading(true);
    
    try {
      // In a real app, this would call the Google Places API
      // For this demo, we'll use real location data for Andheri
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Real parking locations in Andheri
      const andheriParkingSpots = [
        {
          place_id: 'BMC_Marol_AndheriEast_400059',
          name: 'BMC Pay & Park – Marol',
          vicinity: 'Vasant Oasis, Makwana Road, Marol, Andheri East, Mumbai, Maharashtra 400059',
          geometry: {
            location: { lat: 19.1234, lng: 72.8801 }
          },
          photos: [{ photo_reference: 'bmc_marol' }],
          rating: 4.1,
          user_ratings_total: 4200,
          parking: {
            available: 78,
            total: 120,
            hourly_rate: '₹40',
            type: 'Public',
            covered: true
          },
          distance: '1.2 km',
          distanceValue: 1200,
          hours: 'Open 24/7',
          features: 'Large capacity for various vehicles including motorcycles, cars, buses, and trucks'
        },
        {
          place_id: 'MCGM_MIDC_AndheriEast_400069',
          name: 'MCGM Pay & Park – Marol MIDC',
          vicinity: 'Street No. 14, Marol MIDC Industrial Estate, Andheri East, Mumbai, Maharashtra 400069',
          geometry: {
            location: { lat: 19.1184, lng: 72.8795 }
          },
          photos: [{ photo_reference: 'mcgm_midc' }],
          rating: 3.9,
          user_ratings_total: 3800,
          parking: {
            available: 45,
            total: 90,
            hourly_rate: '₹35',
            type: 'Public',
            covered: false
          },
          distance: '1.7 km',
          distanceValue: 1700,
          hours: 'Open 24/7',
          features: 'Well-maintained facility with availability during peak times',
          landmark: 'Near SEEPZ Gate'
        },
        {
          place_id: 'Fulcrum_MCGM_AndheriEast_400099',
          name: 'Fulcrum MCGM Pay & Park',
          vicinity: 'Near Sahar Road, Andheri East, Mumbai',
          geometry: {
            location: { lat: 19.1090, lng: 72.8700 }
          },
          photos: [{ photo_reference: 'fulcrum_mcgm' }],
          rating: 4.0,
          user_ratings_total: 2900,
          parking: {
            available: 32,
            total: 60,
            hourly_rate: '₹40',
            type: 'Public',
            covered: true
          },
          distance: '2.1 km',
          distanceValue: 2100,
          hours: 'Open 24/7',
          features: 'Available via Park+ app'
        },
        {
          place_id: 'Private_SaharRoad_AndheriEast_400093',
          name: 'Private Pay & Park – Sahar Road',
          vicinity: 'Near Skywalk, Sahar Road, Andheri East, Mumbai 400093',
          geometry: {
            location: { lat: 19.1088, lng: 72.8660 }
          },
          photos: [{ photo_reference: 'private_sahar' }],
          rating: 3.7,
          user_ratings_total: 1800,
          parking: {
            available: 25,
            total: 40,
            hourly_rate: '₹50',
            type: 'Private',
            covered: false
          },
          distance: '2.4 km',
          distanceValue: 2400,
          hours: 'Open 24/7'
        },
        {
          place_id: 'InfinityMall_AndheriWest_400053',
          name: 'Infinity Mall – Andheri West',
          vicinity: 'New Link Road, Oshiwara, Andheri West, Mumbai 400053',
          geometry: {
            location: { lat: 19.1413, lng: 72.8318 }
          },
          photos: [{ photo_reference: 'infinity_mall' }],
          rating: 4.3,
          user_ratings_total: 7200,
          parking: {
            available: 110,
            total: 250,
            hourly_rate: '₹60',
            type: 'Mall',
            covered: true
          },
          distance: '3.7 km',
          distanceValue: 3700,
          features: 'Multi-level parking facility'
        },
        {
          place_id: 'CitiMall_AndheriWest_400053',
          name: 'Citi Mall – Andheri West',
          vicinity: 'Survey No. 41, Andheri Link Road, Near Bhaktivedanta Swami Mission School, Andheri West, Mumbai 400053',
          geometry: {
            location: { lat: 19.1370, lng: 72.8400 }
          },
          photos: [{ photo_reference: 'citi_mall' }],
          rating: 4.0,
          user_ratings_total: 5100,
          parking: {
            available: 65,
            total: 150,
            hourly_rate: '₹50',
            type: 'Mall',
            covered: true
          },
          distance: '3.5 km',
          distanceValue: 3500,
          features: 'Parking available for mall visitors'
        },
        {
          place_id: 'PrimeMall_Irla_400056',
          name: 'Prime Mall – Irla',
          vicinity: 'New Link Road, Phase D, Shastri Nagar, Andheri West, Mumbai, Maharashtra',
          geometry: {
            location: { lat: 19.1280, lng: 72.8340 }
          },
          photos: [{ photo_reference: 'prime_mall' }],
          rating: 3.8,
          user_ratings_total: 3600,
          parking: {
            available: 40,
            total: 80,
            hourly_rate: '₹45',
            type: 'Mall',
            covered: true
          },
          distance: '4.1 km',
          distanceValue: 4100,
          features: 'Multi-level parking space'
        },
        {
          place_id: 'PinnacleBusinessPark_AndheriEast_400093',
          name: 'Pinnacle Business Park',
          vicinity: 'Mahakali Caves Road, Andheri East, Mumbai',
          geometry: {
            location: { lat: 19.1220, lng: 72.8680 }
          },
          photos: [{ photo_reference: 'pinnacle' }],
          rating: 4.2,
          user_ratings_total: 2800,
          parking: {
            available: 85,
            total: 200,
            hourly_rate: '₹70',
            type: 'Commercial',
            covered: true
          },
          distance: '1.8 km',
          distanceValue: 1800,
          features: 'Commercial complex with parking facilities'
        },
        {
          place_id: 'SolitaireCorporatePark_AndheriEast_400093',
          name: 'Solitaire Corporate Park',
          vicinity: 'Guru Hargovindji Road, Chakala, Andheri East, Mumbai',
          geometry: {
            location: { lat: 19.1130, lng: 72.8640 }
          },
          photos: [{ photo_reference: 'solitaire' }],
          rating: 4.4,
          user_ratings_total: 3200,
          parking: {
            available: 95,
            total: 180,
            hourly_rate: '₹65',
            type: 'Commercial',
            covered: true
          },
          distance: '2.2 km',
          distanceValue: 2200,
          features: 'Corporate park with dedicated parking'
        },
        {
          place_id: 'OpusPark_AndheriEast_400093',
          name: 'Opus Park',
          vicinity: 'Andheri East, Mumbai',
          geometry: {
            location: { lat: 19.1170, lng: 72.8730 }
          },
          photos: [{ photo_reference: 'opus_park' }],
          rating: 3.9,
          user_ratings_total: 1900,
          parking: {
            available: 40,
            total: 90,
            hourly_rate: '₹55',
            type: 'Commercial',
            covered: true
          },
          distance: '1.9 km',
          distanceValue: 1900,
          features: 'Commercial complex with parking facilities'
        }
      ];
      
      // Filter by search term if one exists
      let filteredSpots = andheriParkingSpots;
      if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        filteredSpots = andheriParkingSpots.filter(spot => 
          spot.name.toLowerCase().includes(lowerSearchTerm) || 
          spot.vicinity.toLowerCase().includes(lowerSearchTerm) ||
          (spot.parking && spot.parking.type && spot.parking.type.toLowerCase().includes(lowerSearchTerm)) ||
          (lowerSearchTerm === 'covered' && spot.parking && spot.parking.covered) ||
          (spot.features && spot.features.toLowerCase().includes(lowerSearchTerm))
        );
      }
      
      // Filter by radius
      filteredSpots = filteredSpots.filter(spot => spot.distanceValue <= radius);
      
      // Sort by distance (nearest first)
      filteredSpots.sort((a, b) => a.distanceValue - b.distanceValue);
      
      setNearbyMalls(filteredSpots);
    } catch (error) {
      console.error('Error searching for nearby spots:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRadiusChange = (e) => {
    const radius = parseInt(e.target.value);
    setSearchRadius(radius);
    if (currentLocation) {
      searchNearbyMalls(currentLocation, radius);
    }
  };

  const handleSearch = (e) => {
    if (e) {
      e.preventDefault();
    }
    if (currentLocation) {
      searchNearbyMalls(currentLocation, searchRadius);
    }
  };

  const handleBookParking = (parkingSpot) => {
    // Pass the parking spot details to the booking page using state
    navigate(`/parking/${parkingSpot.place_id}`, { 
      state: { 
        parkingDetails: {
          id: parkingSpot.place_id,
          name: parkingSpot.name,
          address: parkingSpot.vicinity,
          coordinates: parkingSpot.geometry.location,
          available: parkingSpot.parking.available,
          total: parkingSpot.parking.total,
          hourlyRate: parkingSpot.parking.hourly_rate,
          type: parkingSpot.parking.type,
          hours: parkingSpot.hours || "Not specified",
          features: parkingSpot.features || ""
        }
      }
    });
  };

  const getPhotoUrl = (photoReference) => {
    // In a real app, this would use the Places API photo endpoint
    // For now, return placeholder images based on the reference
    const placeholders = {
      'bmc_marol': 'https://images.unsplash.com/photo-1590674899484-13d6c4f74bd4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
      'mcgm_midc': 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
      'fulcrum_mcgm': 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
      'private_sahar': 'https://images.unsplash.com/photo-1562426209-1736c321f143?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
      'infinity_mall': 'https://images.unsplash.com/photo-1581417478175-a9ef18f210c2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
      'citi_mall': 'https://images.unsplash.com/photo-1555448248-2571daf6344b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
      'prime_mall': 'https://images.unsplash.com/photo-1567449303078-57ad995bd17a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
      'pinnacle': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
      'solitaire': 'https://images.unsplash.com/photo-1464938050520-ef2270bb8ce8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
      'opus_park': 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
      'phoenix': 'https://images.unsplash.com/photo-1557775604-9b8fbaa51512?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
      'rcity': 'https://images.unsplash.com/photo-1519567241313-8b1e156c7838?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
      'infiniti': 'https://images.unsplash.com/photo-1568454537842-d933259bb258?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
      'oberoi': 'https://images.unsplash.com/photo-1568454537842-d933259bb258?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
      'inorbit': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60'
    };
    
    return placeholders[photoReference] || 'https://images.unsplash.com/photo-1609618992870-ac4ea42c4d78?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-yellow-400 rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold text-center">SpotSense</h1>
        <p className="text-center text-black mt-1 text-sm">Find parking spots in Andheri, Mumbai</p>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center text-neutral-700 dark:text-neutral-300 hover:text-yellow-500 dark:hover:text-yellow-400"
        >
          <ArrowRightIcon className="h-4 w-4 mr-1 rotate-180" />
          Back to home
        </button>
      </div>
      
      {/* Search form */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Find Nearest Parking</h3>
            <div className="w-auto">
              <label htmlFor="radius" className="block text-sm font-medium text-gray-700 mb-1">
                Search radius
              </label>
              <select
                id="radius"
                value={searchRadius}
                onChange={handleRadiusChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              >
                <option value="1000">1 km</option>
                <option value="3000">3 km</option>
                <option value="5000">5 km</option>
                <option value="10000">10 km</option>
              </select>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div className="flex-grow">
              <div className="relative">
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search for mall or location"
                  className="w-full p-3 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-base"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              </div>
            </div>
            
            <button
              type="submit"
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium py-3 px-6 rounded flex items-center space-x-2 min-w-[180px] justify-center"
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
              <span>Find Nearest Parking</span>
            </button>
          </div>
          
          <div className="flex gap-3 flex-wrap mt-2">
            <span className="text-sm text-gray-600">Quick options:</span>
            <button 
              type="button" 
              onClick={() => {
                setSearchTerm('Andheri East');
                handleSearch();
              }}
              className="text-sm text-yellow-600 hover:text-yellow-800 bg-yellow-100 px-2 py-0.5 rounded-full"
            >
              Andheri East
            </button>
            <button 
              type="button" 
              onClick={() => {
                setSearchTerm('Andheri West');
                handleSearch();
              }}
              className="text-sm text-yellow-600 hover:text-yellow-800 bg-yellow-100 px-2 py-0.5 rounded-full"
            >
              Andheri West
            </button>
            <button 
              type="button" 
              onClick={() => {
                setSearchTerm('Mall');
                handleSearch();
              }}
              className="text-sm text-yellow-600 hover:text-yellow-800 bg-yellow-100 px-2 py-0.5 rounded-full"
            >
              Mall Parking
            </button>
            <button 
              type="button" 
              onClick={() => {
                setSearchTerm('');
                setSearchRadius(5000);
                handleSearch();
              }}
              className="text-sm text-yellow-600 hover:text-yellow-800 bg-yellow-100 px-2 py-0.5 rounded-full"
            >
              Show All
            </button>
          </div>
        </form>
      </div>
      
      {/* Static Mall Image Banner instead of Google Maps */}
      <div className="mb-6 h-[250px] rounded-lg overflow-hidden shadow-md relative">
        <img 
          src="https://images.unsplash.com/photo-1600200952161-dea428b85a49?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
          alt="Mumbai Parking"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center text-white p-6">
          <h2 className="text-2xl font-bold mb-2 text-center">Andheri Parking Spots</h2>
          <p className="text-center max-w-lg">
            Find and book parking in Andheri East and West, Mumbai - updated with real locations
          </p>
        </div>
      </div>
      
      {/* Parking listing */}
      <h2 className="text-xl font-semibold mb-4">Nearby Parking Spots</h2>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loading />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {nearbyMalls.length === 0 ? (
            <div className="col-span-full text-center py-10">
              <div className="text-yellow-500 mb-4">
                <BuildingStorefrontIcon className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No parking spots found</h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-md mx-auto">
                We couldn&apos;t find any parking spots matching your search criteria. Try increasing the search radius or modifying your search term.
              </p>
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  if (currentLocation) {
                    searchNearbyMalls(currentLocation, 5000);
                  }
                }}
                className="bg-yellow-400 hover:bg-yellow-500 text-black"
              >
                Reset Search
              </Button>
            </div>
          ) : (
            nearbyMalls.map((mall) => (
              <Card key={mall.place_id} className="overflow-hidden" title="" subtitle="" footer={null} image={null} onClick={() => {}}>
                <div className="h-40 overflow-hidden">
                  <img
                    src={getPhotoUrl(mall.photos[0].photo_reference)}
                    alt={mall.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{mall.name}</h3>
                  
                  <div className="flex items-start mb-3">
                    <MapPinIcon className="h-5 w-5 text-neutral-500 flex-shrink-0 mt-0.5 mr-2" />
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                      {mall.vicinity} <span className="text-xs font-medium ml-1">({mall.distance})</span>
                    </p>
                  </div>
                  
                  <div className="flex gap-2 mb-3">
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                      {mall.parking.type}
                    </span>
                    {mall.parking.covered && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                        Covered
                      </span>
                    )}
                  </div>
                  
                  <div className="flex justify-between mb-3">
                    <div className="flex items-center text-sm">
                      <BuildingStorefrontIcon className="h-4 w-4 text-yellow-500 mr-1" />
                      <span>
                        <span className="font-medium">{mall.rating}</span>
                        <span className="text-neutral-500 text-xs"> ({mall.user_ratings_total})</span>
                      </span>
                    </div>
                    
                    <div className="text-sm font-medium text-yellow-600">
                      {mall.parking.hourly_rate}/hr
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-neutral-600">Parking spots available:</span>
                      <span className="font-medium">
                        <span className="text-green-600">{mall.parking.available}</span>
                        /{mall.parking.total}
                      </span>
                    </div>
                    
                    <div className="w-full bg-neutral-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${(mall.parking.available / mall.parking.total) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  {mall.hours && (
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Hours: </span>{mall.hours}
                    </div>
                  )}
                  
                  {mall.features && (
                    <div className="text-sm text-gray-600 mb-3 line-clamp-2">
                      <span className="font-medium">Features: </span>{mall.features}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button
                      fullWidth
                      onClick={() => handleBookParking(mall)}
                      className="bg-yellow-400 hover:bg-yellow-500 text-black"
                    >
                      Book Parking
                    </Button>
                    
                    <button
                      onClick={() => {
                        const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mall.vicinity)}&destination_place_id=${mall.place_id}`;
                        window.open(url, '_blank');
                      }}
                      className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded flex-shrink-0"
                      title="Get directions"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
      
      {/* Mobile navigation dots */}
      <div className="flex justify-center space-x-2 mt-8">
        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
        <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
      </div>
    </div>
  );
};

export default AndheriParkingPage; 