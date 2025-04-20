import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  MapPinIcon, 
  ClockIcon, 
  CreditCardIcon, 
  ShieldCheckIcon,
  ArrowLeftIcon,
  StarIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

const ParkingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [parking, setParking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [vehicle, setVehicle] = useState('car');

  useEffect(() => {
    // In a real app, fetch from API using the id
    // For now, use mock data
    setTimeout(() => {
      const mockData = {
        id: id,
        name: id === 'p1' ? 'BKC Parking Complex' : 
              id === 'p2' ? 'Andheri Metro Parking' : 
              id === 'p3' ? 'Phoenix Mall Parking' : 'Dadar Station Parking',
        address: id === 'p1' ? 'Bandra Kurla Complex, Mumbai' :
                id === 'p2' ? 'Western Express Highway, Andheri' :
                id === 'p3' ? 'Lower Parel, Mumbai' : 'Dadar West, Mumbai',
        description: 'Centrally located parking facility with 24/7 security and CCTV monitoring. Easy access to nearby shopping malls, restaurants, and office complexes.',
        images: [
          'https://images.unsplash.com/photo-1470224114660-3f6686c562eb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTN8fHBhcmtpbmd8ZW58MHx8MHx8&auto=format&fit=crop&w=500&q=60',
          'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTR8fHBhcmtpbmd8ZW58MHx8MHx8&auto=format&fit=crop&w=500&q=60',
        ],
        availableSpots: id === 'p1' ? 23 : id === 'p2' ? 8 : id === 'p3' ? 15 : 5,
        totalSpots: id === 'p1' ? 50 : id === 'p2' ? 60 : id === 'p3' ? 120 : 40,
        distance: id === 'p1' ? '0.5 km' : id === 'p2' ? '1.2 km' : id === 'p3' ? '2.8 km' : '3.5 km',
        hours: id === 'p1' ? '24 hours' : id === 'p2' ? '6 AM - 10 PM' : id === 'p3' ? '10 AM - 11 PM' : '5 AM - 12 AM',
        rate: id === 'p1' ? '₹50/hour' : id === 'p2' ? '₹40/hour' : id === 'p3' ? '₹60/hour' : '₹30/hour',
        hourlyRate: id === 'p1' ? 50 : id === 'p2' ? 40 : id === 'p3' ? 60 : 30,
        amenities: ['CCTV', 'Security Guard', 'EV Charging', 'Car Wash'],
        rating: 4.5,
        reviews: 128,
        lat: 19.1266816,
        lng: 72.8662016,
      };

      setParking(mockData);
      setIsLoading(false);
    }, 1000);
  }, [id]);

  const handleDateChange = (e) => {
    setSelectedDate(new Date(e.target.value));
  };

  const handleBooking = (e) => {
    e.preventDefault();
    // Calculate hours and total cost
    const start = new Date(`${selectedDate.toISOString().split('T')[0]}T${startTime}`);
    const end = new Date(`${selectedDate.toISOString().split('T')[0]}T${endTime}`);
    const hours = (end - start) / (1000 * 60 * 60);
    const cost = hours * parking.hourlyRate;

    // In a real app, this would make an API call to book the spot
    alert(`Booking confirmed!\nDate: ${selectedDate.toDateString()}\nTime: ${startTime} to ${endTime}\nVehicle: ${vehicle}\nTotal Cost: ₹${cost}`);
    
    // Navigate to booking confirmation page
    navigate('/bookings');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (!parking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-2">
            Parking Not Found
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            The parking spot you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium py-2 px-6 rounded"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <button 
        onClick={() => navigate('/')}
        className="flex items-center text-neutral-700 dark:text-neutral-300 hover:text-yellow-500 dark:hover:text-yellow-400 mb-4"
      >
        <ArrowLeftIcon className="h-4 w-4 mr-1" />
        Back to search
      </button>
      
      <button 
        onClick={() => navigate(`/parking/${id}`)}
        className="flex items-center text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 mb-6"
      >
        <ArrowRightIcon className="h-4 w-4 mr-1" />
        Book a Specific Slot
      </button>
      
      {/* Header */}
      <div className="bg-yellow-400 rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold text-center">SpotSense</h1>
        <p className="text-center text-black mt-1 text-sm">View parking facility details and amenities</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Parking Details */}
        <div className="lg:col-span-2">
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white mb-2">
            {parking.name}
          </h1>
          
          <div className="flex items-center mb-4">
            <div className="flex items-center mr-4">
              <StarIconSolid className="h-5 w-5 text-yellow-400" />
              <span className="ml-1 font-medium">{parking.rating}</span>
              <span className="ml-1 text-neutral-500 dark:text-neutral-400">({parking.reviews} reviews)</span>
            </div>
            <div className="text-sm bg-neutral-100 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-300 px-2 py-1 rounded">
              {parking.distance}
            </div>
          </div>
          
          <div className="rounded-lg overflow-hidden mb-6 h-64">
            <img 
              src={parking.images[0]} 
              alt={parking.name} 
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="flex items-start mb-5">
            <MapPinIcon className="h-5 w-5 text-neutral-500 dark:text-neutral-400 mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-neutral-700 dark:text-neutral-300">
              {parking.address}
            </p>
          </div>
          
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
              About this parking
            </h2>
            <p className="text-neutral-700 dark:text-neutral-300">
              {parking.description}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <ClockIcon className="h-5 w-5 text-yellow-500 mr-2" />
                <h3 className="font-medium text-neutral-900 dark:text-white">Hours</h3>
              </div>
              <p className="text-neutral-700 dark:text-neutral-300">{parking.hours}</p>
            </div>
            
            <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <CreditCardIcon className="h-5 w-5 text-yellow-500 mr-2" />
                <h3 className="font-medium text-neutral-900 dark:text-white">Pricing</h3>
              </div>
              <div className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                {parking.rate}
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">
              Amenities
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {parking.amenities.map((amenity, index) => (
                <div key={index} className="flex items-center bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg">
                  <ShieldCheckIcon className="h-5 w-5 text-yellow-500 mr-2" />
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">{amenity}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">
              Availability
            </h2>
            <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-neutral-700 dark:text-neutral-300">Available spots:</span>
                <span className="font-medium text-yellow-600 dark:text-yellow-400">
                  {parking.availableSpots} / {parking.totalSpots}
                </span>
              </div>
              <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2.5">
                <div 
                  className="bg-yellow-400 h-2.5 rounded-full" 
                  style={{ width: `${(parking.availableSpots / parking.totalSpots) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Column - Booking Form */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6 sticky top-4">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
              Book this spot
            </h2>
            
            <form onSubmit={handleBooking}>
              <div className="mb-4">
                <label className="block text-neutral-700 dark:text-neutral-300 mb-2" htmlFor="date">
                  Date
                </label>
                <input
                  type="date"
                  id="date"
                  value={selectedDate.toISOString().split('T')[0]}
                  onChange={handleDateChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded focus:ring-2 focus:ring-yellow-400 dark:bg-neutral-700 dark:text-white"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 mb-2" htmlFor="startTime">
                    Start Time
                  </label>
                  <input
                    type="time"
                    id="startTime"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded focus:ring-2 focus:ring-yellow-400 dark:bg-neutral-700 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 mb-2" htmlFor="endTime">
                    End Time
                  </label>
                  <input
                    type="time"
                    id="endTime"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded focus:ring-2 focus:ring-yellow-400 dark:bg-neutral-700 dark:text-white"
                    required
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-neutral-700 dark:text-neutral-300 mb-2" htmlFor="vehicle">
                  Vehicle Type
                </label>
                <select
                  id="vehicle"
                  value={vehicle}
                  onChange={(e) => setVehicle(e.target.value)}
                  className="w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded focus:ring-2 focus:ring-yellow-400 dark:bg-neutral-700 dark:text-white"
                  required
                >
                  <option value="car">Car</option>
                  <option value="motorcycle">Motorcycle</option>
                  <option value="suv">SUV</option>
                  <option value="ev">Electric Vehicle</option>
                </select>
              </div>
              
              <div className="mb-4 py-3 border-t border-b border-neutral-200 dark:border-neutral-700">
                <div className="flex justify-between mb-2">
                  <span className="text-neutral-700 dark:text-neutral-300">Rate</span>
                  <span className="font-medium">{parking.rate}</span>
                </div>
                {startTime && endTime && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-neutral-700 dark:text-neutral-300">Estimated total</span>
                      <span className="font-medium">
                        {(() => {
                          try {
                            const start = new Date(`2023-01-01T${startTime}`);
                            const end = new Date(`2023-01-01T${endTime}`);
                            if (end < start) end.setDate(end.getDate() + 1);
                            const hours = (end - start) / (1000 * 60 * 60);
                            return `₹${(hours * parking.hourlyRate).toFixed(2)}`;
                          } catch (e) {
                            return 'Please select valid times';
                          }
                        })()}
                      </span>
                    </div>
                  </>
                )}
              </div>
              
              <button
                type="submit"
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-medium py-3 px-4 rounded transition-colors duration-300"
                disabled={!startTime || !endTime}
              >
                Book Now
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParkingDetailPage; 