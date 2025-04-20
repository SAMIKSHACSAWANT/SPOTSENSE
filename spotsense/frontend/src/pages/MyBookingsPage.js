import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClockIcon, MapPinIcon, TicketIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { Card, Button, Loading } from '../components/common';

const MyBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // In a real app, this would be an API call to fetch the user's bookings
    // For now, we'll use mock data
    setTimeout(() => {
      const mockBookings = [
        {
          id: 'BK123456',
          parkingName: 'Nakshatra Mall',
          parkingAddress: '385, N C Kelkar Marg, Dadar West, Mumbai',
          slotNumber: '42',
          vehicleNumber: 'MH04AB1234',
          vehicleType: 'car',
          duration: '2',
          date: '2023-06-15',
          time: '14:30',
          amount: '₹80',
          status: 'completed'
        },
        {
          id: 'BK789012',
          parkingName: 'Metro Station Parking',
          parkingAddress: 'Western Express Highway, Andheri',
          slotNumber: '12',
          vehicleNumber: 'MH02CD5678',
          vehicleType: 'bike',
          duration: '5',
          date: '2023-06-10',
          time: '09:15',
          amount: '₹200',
          status: 'completed'
        },
        {
          id: 'BK345678',
          parkingName: 'Phoenix Mall Parking',
          parkingAddress: 'Lower Parel, Mumbai',
          slotNumber: '23',
          vehicleNumber: 'MH01EF9012',
          vehicleType: 'suv',
          duration: '3',
          date: '2023-06-05',
          time: '18:45',
          amount: '₹120',
          status: 'completed'
        },
        {
          id: 'BK901234',
          parkingName: 'Dadar Station Parking',
          parkingAddress: 'Dadar West, Mumbai',
          slotNumber: '8',
          vehicleNumber: 'MH04AB1234',
          vehicleType: 'car',
          duration: '24',
          date: '2023-05-28',
          time: '11:00',
          amount: '₹960',
          status: 'completed'
        },
      ];
      
      setBookings(mockBookings);
      setIsLoading(false);
    }, 1500);
  }, []);

  const downloadTicket = (booking) => {
    // In a real app, this would generate and download a PDF ticket
    console.log('Downloading ticket for booking:', booking.id);
    alert(`Ticket for booking ${booking.id} downloaded successfully!`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white mb-2">
          My Bookings
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
          View your parking booking history
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-[50vh]">
          <Loading size="lg" />
          <p className="mt-4 text-neutral-600 dark:text-neutral-400">Loading your bookings...</p>
        </div>
      ) : (
        <>
          {bookings.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-yellow-500 mb-4">
                <TicketIcon className="h-16 w-16 mx-auto" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No bookings found</h2>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                You haven&apos;t made any parking bookings yet.
              </p>
              <Button 
                onClick={() => navigate('/')}
                className="bg-yellow-400 hover:bg-yellow-500 text-black"
              >
                Find Parking
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {bookings.map((booking) => (
                <Card 
                  key={booking.id} 
                  className="overflow-hidden"
                  title=""
                  subtitle=""
                  footer={null}
                  image={null}
                  onClick={() => {}}
                >
                  <div className="p-5 border-l-4 border-yellow-400">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center mb-2">
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full mr-2">
                            {booking.status === 'completed' ? 'Completed' : 'Active'}
                          </span>
                          <h3 className="font-semibold">{booking.parkingName}</h3>
                        </div>
                        
                        <div className="flex items-start mb-2">
                          <MapPinIcon className="h-5 w-5 text-neutral-500 flex-shrink-0 mt-0.5 mr-2" />
                          <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                            {booking.parkingAddress}
                          </p>
                        </div>
                        
                        <div className="flex items-center mb-2">
                          <ClockIcon className="h-5 w-5 text-neutral-500 flex-shrink-0 mr-2" />
                          <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                            {booking.date} at {booking.time}
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                          <div>
                            <p className="text-neutral-500">Booking ID</p>
                            <p className="font-medium">{booking.id}</p>
                          </div>
                          <div>
                            <p className="text-neutral-500">Slot Number</p>
                            <p className="font-medium">{booking.slotNumber}</p>
                          </div>
                          <div>
                            <p className="text-neutral-500">Vehicle</p>
                            <p className="font-medium">{booking.vehicleNumber} ({booking.vehicleType})</p>
                          </div>
                          <div>
                            <p className="text-neutral-500">Duration</p>
                            <p className="font-medium">{booking.duration} {booking.duration === '24' ? 'hours (Full Day)' : (parseInt(booking.duration) === 1 ? 'hour' : 'hours')}</p>
                          </div>
                          <div>
                            <p className="text-neutral-500">Amount Paid</p>
                            <p className="font-medium">{booking.amount}</p>
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<DocumentArrowDownIcon className="h-4 w-4" />}
                        onClick={() => downloadTicket(booking)}
                        className="flex-shrink-0"
                      >
                        Ticket
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyBookingsPage; 