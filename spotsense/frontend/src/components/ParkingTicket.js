import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCar, FaCalendarAlt, FaClock, FaMapMarkerAlt, FaMoneyBillWave, FaTicketAlt, FaDownload, FaDirections } from 'react-icons/fa';
import parkingService from '../services/api';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const ParkingTicket = ({ ticket }) => {
  const ticketRef = useRef(null);
  const navigate = useNavigate();
  
  if (!ticket) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4">
        <p className="text-red-700">Ticket information not available.</p>
      </div>
    );
  }
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const calculateDuration = () => {
    const entry = new Date(ticket.entryTime);
    const exit = new Date(ticket.exitTime);
    const diff = exit - entry;
    const hours = Math.round(diff / (1000 * 60 * 60));
    return hours;
  };
  
  const handleDownloadPDF = () => {
    const ticketElement = ticketRef.current;
    
    html2canvas(ticketElement, {
      scale: 2,
      logging: false,
      useCORS: true
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`parking-ticket-${ticket.ticketId}.pdf`);
    });
  };
  
  const handleGetDirections = () => {
    const url = parkingService.getDirectionsUrl(
      { lat: ticket.userLat, lng: ticket.userLng },
      { latitude: ticket.parkingLat, longitude: ticket.parkingLng }
    );
    
    if (url) {
      window.open(url, '_blank');
    } else {
      alert('Unable to get directions. Location information is missing.');
    }
  };
  
  return (
    <div className="max-w-lg mx-auto my-8 px-4">
      <div ref={ticketRef} className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Ticket Header */}
        <div className="bg-blue-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FaTicketAlt className="text-white text-3xl mr-3" />
              <div>
                <h2 className="text-white font-bold text-xl">Parking Ticket</h2>
                <p className="text-blue-100 text-sm">Booking confirmed</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white font-mono text-sm"># {ticket.ticketId}</p>
              <p className="text-blue-100 text-xs">{formatDate(ticket.bookingTime)}</p>
            </div>
          </div>
        </div>
        
        {/* Ticket Body */}
        <div className="px-6 py-4">
          <h3 className="font-bold text-lg mb-3">{ticket.parkingName}</h3>
          
          <div className="mb-4 pb-4 border-b border-gray-200">
            <div className="flex items-start mb-2">
              <FaMapMarkerAlt className="text-gray-500 mt-1 mr-2" />
              <p className="text-sm text-gray-600">{ticket.parkingAddress}</p>
            </div>
            
            <div className="flex items-center mb-2">
              <FaCar className="text-gray-500 mr-2" />
              <p className="text-sm font-medium">Slot ID: {ticket.slotId}</p>
            </div>
            
            <div className="flex items-center">
              <FaCalendarAlt className="text-gray-500 mr-2" />
              <p className="text-sm">Date: {formatDate(ticket.entryTime)}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-gray-200">
            <div>
              <p className="text-xs text-gray-500">ENTRY TIME</p>
              <p className="font-semibold">{formatTime(ticket.entryTime)}</p>
            </div>
            
            <div>
              <p className="text-xs text-gray-500">EXIT BY</p>
              <p className="font-semibold">{formatTime(ticket.exitTime)}</p>
            </div>
            
            <div>
              <p className="text-xs text-gray-500">DURATION</p>
              <p className="font-semibold">{calculateDuration()} hours</p>
            </div>
            
            <div>
              <p className="text-xs text-gray-500">NAME</p>
              <p className="font-semibold">{ticket.name}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500">VEHICLE NUMBER</p>
              <p className="font-semibold">{ticket.vehicleNumber}</p>
            </div>
          </div>
          
          <div className="mb-4 pb-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500">PAYMENT AMOUNT</p>
                <p className="text-lg font-bold">₹{ticket.amount.toFixed(2)}</p>
              </div>
              
              <div className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
                {ticket.paymentStatus}
              </div>
            </div>
          </div>
          
          <div className="text-center text-xs text-gray-500">
            <p>Please show this ticket when requested by parking staff.</p>
            <p>Thank you for using our service!</p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between mt-4">
        <button
          onClick={handleDownloadPDF}
          className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-300"
        >
          <FaDownload className="mr-2" />
          Download PDF
        </button>
        
        <button
          onClick={handleGetDirections}
          className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-300"
        >
          <FaDirections className="mr-2" />
          Get Directions
        </button>
      </div>
      
      <div className="text-center mt-6">
        <button
          onClick={() => navigate('/')}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default ParkingTicket; 