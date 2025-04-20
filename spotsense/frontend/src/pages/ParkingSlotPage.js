import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { MapIcon, ClockIcon, CurrencyRupeeIcon, ArrowPathIcon, MapPinIcon, VideoCameraIcon, EyeIcon, CheckCircleIcon, AdjustmentsHorizontalIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { Card, Button, Input, Select, Badge, Loading, Alert, Modal } from '../components/common';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { LoginModal, SignupModal } from '../components/auth';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { format } from 'date-fns';

// Set the base URL for the Python backend API
const API_BASE_URL = '/api'; // Use relative path for API requests

// Add after the API_BASE_URL constant
const HOURLY_RATE = 40; // ₹40 per hour
const REFRESH_INTERVAL = 30000; // Increased to 30 seconds (from 10 seconds)

// Duration options
const DURATION_OPTIONS = [
  { value: '1', label: '1 Hour', hours: 1 },
  { value: '2', label: '2 Hours', hours: 2 },
  { value: '3', label: '3 Hours', hours: 3 },
  { value: '4', label: '4 Hours', hours: 4 },
  { value: '24', label: '24 Hours (Full Day)', hours: 24 }
];

// Vehicle types
const VEHICLE_TYPES = [
  { value: 'car', label: 'Car' },
  { value: 'bike', label: 'Bike/Scooter' },
  { value: 'suv', label: 'SUV' },
  { value: 'truck', label: 'Truck/Van' }
];

// Payment methods
const PAYMENT_METHODS = [
  { value: 'upi', label: 'UPI' },
  { value: 'card', label: 'Credit/Debit Card' },
  { value: 'cash', label: 'Cash' }
];

// Add local video sources at the top of the file
const LOCAL_VIDEOS = {
  main: '/videos/carPark.mp4',
  reverse: '/videos/carPark_Reverse.mp4'
};

const ParkingSlotPage = () => {
  const { parkingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  
  // Get parking details from location state if available
  const passedParkingDetails = location.state?.parkingDetails;
  
  const [isLoading, setIsLoading] = useState(true);
  const [parkingDetails, setParkingDetails] = useState(null);
  const [parkingSlots, setParkingSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isAPIConnected, setIsAPIConnected] = useState(false);
  const [videoFeed, setVideoFeed] = useState(null);
  const [showVideo, setShowVideo] = useState(false);
  const [pauseRefresh, setPauseRefresh] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const [videoSource, setVideoSource] = useState('main');
  const [videoSources, setVideoSources] = useState([]);
  const [debugMode, setDebugMode] = useState(false);
  const [processingMode, setProcessingMode] = useState('full');
  const [viewMode, setViewMode] = useState('processed'); // 'processed', 'raw', 'grayscale', 'threshold'
  
  // Booking form
  const [bookingForm, setBookingForm] = useState({
    name: '',
    vehicleNumber: '',
    vehicleType: 'car',
    mobileNumber: '',
    paymentMethod: 'upi',
    duration: '1',
    totalAmount: HOURLY_RATE // Default to 1 hour rate
  });
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingReference, setBookingReference] = useState(null);

  // Add card form state
  const [cardForm, setCardForm] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: ''
  });

  // Add ticket ref for PDF generation
  const ticketRef = useRef(null);

  // Function to fetch video feed from the backend
  const fetchVideoFeed = async () => {
    try {
      // Make a fetch request to check if the video API is available
      const response = await fetch(`${window.location.protocol}//${window.location.hostname}:5000/api/parking/video/status`, {
        method: 'GET',
      });
      
      if (response.ok) {
        const data = await response.json();
        setVideoSource(data.current_source);
        setDebugMode(data.debug_mode);
        setProcessingMode(data.processing_mode);
        console.log('Video status:', data);
        
        // Set the video feed URL directly to the streaming endpoint
        updateVideoFeedUrl(data.current_source);
        
        // Also fetch available video sources
        fetchVideoSources();
        
        setIsAPIConnected(true);
      } else {
        throw new Error('Video API not available');
      }
    } catch (error) {
      console.error('Error setting up video feed:', error);
      // If API fails, set to use local video files as fallback
      setVideoFeed(LOCAL_VIDEOS[videoSource || 'main']);
      setIsAPIConnected(false);
      toast.info("Using local video file as backend is not available");
    }
  };
  
  const fetchVideoSources = async () => {
    try {
      const response = await fetch(`${window.location.protocol}//${window.location.hostname}:5000/api/parking/video/sources`);
      if (response.ok) {
        const data = await response.json();
        setVideoSources(data.available);
        setVideoSource(data.current);
      }
    } catch (error) {
      console.error('Error fetching video sources:', error);
    }
  };
  
  const updateVideoFeedUrl = (source) => {
    const baseUrl = `${window.location.protocol}//${window.location.hostname}:5000/api/parking`;
    
    // Set URL based on view mode
    let url;
    switch (viewMode) {
      case 'raw':
        url = `${baseUrl}/video/raw`;
        break;
      case 'grayscale':
        url = `${baseUrl}/video/grayscale`;
        break;
      case 'threshold':
        url = `${baseUrl}/video/threshold`;
        break;
      case 'processed':
      default:
        url = `${baseUrl}/video`;
    }
    
    setVideoFeed(url);
    console.log('Video feed URL set to:', url);
  };
  
  const changeVideoSource = async (source) => {
    try {
      if (isAPIConnected) {
        const response = await fetch(`${window.location.protocol}//${window.location.hostname}:5000/api/parking/video/select`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ source })
        });
        
        if (response.ok) {
          const data = await response.json();
          setVideoSource(data.current_source);
          toast.success(`Video source changed to ${source}`);
          // Refresh the feed URL
          updateVideoFeedUrl(source);
        } else {
          throw new Error('Failed to change video source');
        }
      } else {
        // Use local video sources when API is not connected
        setVideoSource(source);
        setVideoFeed(LOCAL_VIDEOS[source]);
        toast.info(`Video source changed to ${source} (local file)`);
      }
    } catch (error) {
      console.error('Error changing video source:', error);
      // Fallback to local videos
      setVideoSource(source);
      setVideoFeed(LOCAL_VIDEOS[source]);
      toast.info(`Video source changed to ${source} (local file)`);
    }
  };
  
  const toggleDebugMode = async () => {
    try {
      const newDebugMode = !debugMode;
      const response = await fetch(`${window.location.protocol}//${window.location.hostname}:5000/api/parking/video/debug`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ enabled: newDebugMode })
      });
      
      if (response.ok) {
        setDebugMode(newDebugMode);
        toast.success(`Debug mode ${newDebugMode ? 'enabled' : 'disabled'}`);
      } else {
        throw new Error('Failed to toggle debug mode');
      }
    } catch (error) {
      console.error('Error toggling debug mode:', error);
      toast.error('Failed to toggle debug mode');
    }
  };
  
  const setVideoProcessingMode = async (mode) => {
    try {
      const response = await fetch(`${window.location.protocol}//${window.location.hostname}:5000/api/parking/video/mode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ mode })
      });
      
      if (response.ok) {
        setProcessingMode(mode);
        toast.success(`Processing mode set to ${mode}`);
      } else {
        throw new Error('Failed to change processing mode');
      }
    } catch (error) {
      console.error('Error changing processing mode:', error);
      toast.error('Failed to change processing mode');
    }
  };
  
  const changeViewMode = (mode) => {
    setViewMode(mode);
    updateVideoFeedUrl(videoSource);
    toast.info(`View changed to ${mode}`);
  };

  // Use the generateSlotsData function to generate slot data without updating state
  const generateSlotsData = (total, available) => {
    const slots = [];
    const availableSlots = [];
    
    // Generate random available slots
    while (availableSlots.length < available) {
      const randomSlot = Math.floor(Math.random() * total) + 1;
      if (!availableSlots.includes(randomSlot)) {
        availableSlots.push(randomSlot);
      }
    }
    
    // Create the slots array with status
    for (let i = 1; i <= total; i++) {
      slots.push({
        id: i,
        number: i,
        status: availableSlots.includes(i) ? 'available' : 'occupied',
        type: i % 5 === 0 ? 'handicapped' : i % 7 === 0 ? 'electric' : 'standard'
      });
    }
    
    return slots;
  };

  // Remove the old duplicate generateParkingSlots function and update this one
  const generateParkingSlots = (total, available) => {
    const slots = generateSlotsData(total, available);
    setParkingSlots(slots);
    return slots;
  };

  useEffect(() => {
    // Check if we have parking details passed from the previous page
    if (passedParkingDetails) {
      // Use the passed parking details
      setParkingDetails({
        id: passedParkingDetails.id,
        name: passedParkingDetails.name,
        address: passedParkingDetails.address,
        coordinates: passedParkingDetails.coordinates,
        hours: passedParkingDetails.hours,
        operatingTime: passedParkingDetails.hours,
        rates: {
          hourly: passedParkingDetails.hourlyRate,
          daily: `₹${parseInt(passedParkingDetails.hourlyRate.replace('₹', '').replace('/hr', '')) * 5}/day`
        },
        features: passedParkingDetails.features ? passedParkingDetails.features.split(', ') : [],
        totalSlots: 69, // Always set to 69 total spots
        availableSlots: passedParkingDetails.available,
        type: passedParkingDetails.type
      });
      
      // Generate parking slots based on the passed details
      generateParkingSlots(69, passedParkingDetails.available);
      
      setIsLoading(false);
    } else {
      // Fallback to fetching parking details
      fetchParkingDetails();
    }

    // Attempt to load the video feed
    fetchVideoFeed();

    // Set up interval to periodically refresh data with longer interval
    const intervalId = setInterval(() => {
      // Only refresh if not paused (user is not in booking process)
      if (!pauseRefresh && !passedParkingDetails) {
        fetchLiveData();
        setLastRefreshTime(new Date().toLocaleTimeString());
      }
    }, REFRESH_INTERVAL);

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [parkingId, passedParkingDetails, pauseRefresh]);
  
  // Effect to update video feed URL when view mode changes
  useEffect(() => {
    if (videoFeed) {
      updateVideoFeedUrl(videoSource);
    }
  }, [viewMode]);
  
  // Effect to pause refresh when booking modal is open
  useEffect(() => {
    setPauseRefresh(isBookingModalOpen);
  }, [isBookingModalOpen]);

  // Add keyboard event listener for debug mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only respond to keyboard events when video is showing
      if (!showVideo) return;
      
      // 'D' key toggles debug mode
      if (e.key.toLowerCase() === 'd') {
        toggleDebugMode();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showVideo, debugMode]);

  // Update slots when live data comes in
  const updateSlots = (newSlots) => {
    setParkingSlots(prevSlots => {
      return prevSlots.map(slot => {
        const updatedSlot = newSlots.find(s => s.id === slot.id);
        return updatedSlot || slot;
      });
    });
  };

  const handleSlotSelect = (slot) => {
    // Don't select occupied slots
    if (slot.status === 'occupied') return;
    
    // Toggle selection
    if (selectedSlot && selectedSlot.id === slot.id) {
      setSelectedSlot(null);
    } else {
      setSelectedSlot(slot);
    }
  };

  const fetchLiveData = async () => {
    // Don't fetch if booking modal is open
    if (isBookingModalOpen) return;
    
    try {
      // Try to connect to the Python backend API for real-time video processing
      const response = await fetch(`${API_BASE_URL}/parking/spaces${parkingDetails?.id ? `?parkingId=${parkingDetails.id}` : ''}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data) {
        setIsAPIConnected(true);
        console.log('Raw API response:', data); // Log the raw response for debugging
        
        // Update available spots count based on real data
        if (parkingDetails) {
          setParkingDetails(prev => ({
            ...prev,
            availableSlots: data.available,
            totalSlots: data.total || 69 // Use total from API if available
          }));
        }
        
        // Transform API data to match our slot format
        if (data.spaces && Object.keys(data.spaces).length > 0) {
          // If real spaces data is provided, convert from object to array
          const apiSlots = Object.entries(data.spaces).map(([id, space]) => ({
            id: parseInt(id),
            number: parseInt(id) + 1, // Slot numbers start from 1
            status: space.status === 'available' ? 'available' : 'occupied',
            type: parseInt(id) % 5 === 0 ? 'premium' : 'standard'
          }));
          
          console.log('Transformed API slots:', apiSlots); // Log for debugging
          updateSlots(apiSlots);
        } else {
          // If only count is provided, create slots with random occupied/available
          console.log('Using counts to generate random slots: total=', data.total, 'available=', data.available);
          const newSlots = generateSlotsData(data.total || 69, data.available);
          updateSlots(newSlots);
        }
        
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error fetching live parking data from video system:', error);
      
      // If API call fails, use mock data as fallback
      if (!isAPIConnected) {
        console.log('Falling back to mock data');
        const mockSlots = Array.from({ length: 69 }, (_, index) => {
          // Use a deterministic pattern for occupied slots
          const isOccupied = [3, 7, 10, 14, 19, 20, 22, 25, 31, 33, 39, 42, 44, 47, 50, 52, 56, 58, 60, 63, 67].includes(index);
          return {
            id: index,
            number: index + 1,
            status: isOccupied ? 'occupied' : 'available',
            type: index % 5 === 0 ? 'premium' : 'standard'
          };
        });
        
        updateSlots(mockSlots);
        
        // Update parking details to show correct number of available spots
        if (parkingDetails) {
          const availableSpots = mockSlots.filter(slot => slot.status === 'available').length;
          setParkingDetails(prev => ({
            ...prev,
            availableSlots: availableSpots,
            totalSlots: 69 // Always 69 total
          }));
        }
        
        setIsLoading(false);
      }
    }
  };

  const fetchParkingDetails = () => {
    // Fetch parking details from an API
    setIsLoading(true);
    
    fetch(`${API_BASE_URL}/parking/details/${parkingId}`)
      .then(response => {
        // If the API endpoint doesn't exist yet, we'll proceed with mock data
        if (!response.ok) {
          // Create mock data
          const mockParkingDetails = {
            id: parkingId,
            name: 'Central Mall Parking',
            address: '123 Main Street, City Center',
            totalSlots: 40,
            availableSlots: 15,
            rates: {
              hourly: '₹50/hour',
              daily: '₹400/day'
            },
            operatingHours: '6:00 AM - 10:00 PM'
          };
          
          return mockParkingDetails;
        }
        
        return response.json();
      })
      .then(data => {
        setParkingDetails(data);
        
        // Generate parking slots based on the data
        generateParkingSlots(data.totalSlots, data.availableSlots);
        
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching parking details:', error);
        
        // Fallback to mock data on error
        const mockParkingDetails = {
          id: parkingId,
          name: 'Central Mall Parking',
          address: '123 Main Street, City Center',
          totalSlots: 40,
          availableSlots: 15,
          rates: {
            hourly: '₹50/hour',
            daily: '₹400/day'
          },
          operatingHours: '6:00 AM - 10:00 PM'
        };
        
        setParkingDetails(mockParkingDetails);
        generateParkingSlots(mockParkingDetails.totalSlots, mockParkingDetails.availableSlots);
        setIsLoading(false);
      });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Calculate price when duration changes
    if (name === 'duration') {
      const price = calculatePrice(value);
      setBookingForm(prev => ({
        ...prev,
        totalAmount: price
      }));
    }
  };

  const handleBookClick = () => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      toast.warning("Please login to book a parking slot");
      setIsLoginModalOpen(true);
      return;
    }
    
    // Proceed with booking if authenticated
    setIsBookingModalOpen(true);
  };

  const handleGetDirections = () => {
    // Try to get user's current location for better directions
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const origin = `${position.coords.latitude},${position.coords.longitude}`;
          const destination = `${parkingDetails.coordinates[0]},${parkingDetails.coordinates[1]}`;
          
          // Open Google Maps with directions from current location to parking
          window.open(
            `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`,
            '_blank'
          );
          
          toast.success("Directions loaded with your current location");
        },
        (error) => {
          console.error("Error getting user location:", error);
          
          // Fallback to just opening the destination
          window.open(
            `https://www.google.com/maps/dir/?api=1&destination=${parkingDetails.coordinates[0]},${parkingDetails.coordinates[1]}`,
            '_blank'
          );
          
          toast.info("Using default directions without your current location");
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      // Browser doesn't support geolocation
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${parkingDetails.coordinates[0]},${parkingDetails.coordinates[1]}`,
        '_blank'
      );
      
      toast.warning("Your browser doesn't support geolocation");
    }
  };

  const downloadTicket = () => {
    toast.info("Generating your PDF ticket...");
    
    // Wait for the next render cycle to ensure the ticket content is fully rendered
    setTimeout(() => {
      const ticketElement = ticketRef.current;
      
      if (!ticketElement) {
        toast.error("Could not generate ticket");
        return;
      }
      
      // Use html2canvas to capture the ticket as an image
      html2canvas(ticketElement, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      }).then(canvas => {
        try {
          // Create a new PDF document
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
          });
          
          // Get image from canvas and add to PDF
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = 190; // Width in mm (A4 is 210mm wide, leaving margin)
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          // Add company logo/header
          pdf.setFillColor(255, 204, 0); // Yellow header
          pdf.rect(0, 0, 210, 20, 'F');
          pdf.setTextColor(0, 0, 0);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(16);
          pdf.text('SpotSense - Smart Parking', 105, 12, { align: 'center' });
          
          // Add image of the ticket
          pdf.addImage(imgData, 'PNG', 10, 30, imgWidth, imgHeight);
          
          // Add customer details
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`Name: ${bookingForm.name}`, 20, imgHeight + 40);
          pdf.text(`Vehicle: ${bookingForm.vehicleNumber} (${VEHICLE_TYPES.find(v => v.value === bookingForm.vehicleType)?.label})`, 20, imgHeight + 48);
          pdf.text(`Mobile: ${bookingForm.mobileNumber}`, 20, imgHeight + 56);
          pdf.text(`Duration: ${bookingForm.duration} ${parseInt(bookingForm.duration) === 1 ? 'hour' : 'hours'}`, 20, imgHeight + 64);
          pdf.text(`Amount Paid: ₹${calculatePrice(bookingForm.duration)}`, 20, imgHeight + 72);
          
          // Add footer
          pdf.setDrawColor(200, 200, 200);
          pdf.line(10, 280, 200, 280);
          pdf.setFontSize(10);
          pdf.setTextColor(100, 100, 100);
          pdf.text('Thank you for using SpotSense. Drive safely!', 105, 288, { align: 'center' });
          
          // Save PDF
          pdf.save(`SpotSense_Parking_Ticket_${bookingReference}.pdf`);
          
          toast.success("Ticket downloaded successfully!");
        } catch (error) {
          console.error("Error generating PDF: ", error);
          toast.error("Error generating PDF ticket. Please try again.");
        }
      }).catch(error => {
        console.error("Error capturing ticket: ", error);
        toast.error("Error generating ticket. Please try again.");
      });
    }, 500);
  };

  const validateForm = () => {
    const { name, vehicleNumber, mobileNumber } = bookingForm;
    
    if (!name.trim()) {
      toast.error("Please enter your name");
      return false;
    }
    
    if (!vehicleNumber.trim()) {
      toast.error("Please enter your vehicle number");
      return false;
    }
    
    // Validate mobile number (exactly 10 digits)
    if (!/^\d{10}$/.test(mobileNumber.trim())) {
      toast.error("Please enter a valid 10-digit mobile number");
      return false;
    }
    
    return true;
  };

  const handleBooking = () => {
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    // Create booking data
    const bookingData = {
      parkingId: parkingDetails?.id,
      slotId: selectedSlot?.id,
      slotNumber: selectedSlot?.number,
      name: bookingForm.name,
      vehicleNumber: bookingForm.vehicleNumber,
      vehicleType: bookingForm.vehicleType,
      mobileNumber: bookingForm.mobileNumber,
      duration: bookingForm.duration,
      totalAmount: calculatePrice(bookingForm.duration)
    };
    
    // Use fetch to simulate API call to book parking
    // In a real app, you would make an actual API call to your backend
    fetch(`${API_BASE_URL}/parking/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData)
    })
    .then(response => {
      // If the API doesn't exist yet, we'll proceed with mock data
      // In a real app, you would only proceed if response.ok is true
      return response.ok ? response.json() : { 
        success: true, 
        reference: `BK${Math.floor(Math.random() * 900000) + 100000}`
      };
    })
    .then(data => {
      // Set the booking reference from the response or use the mock one
      setBookingReference(data.reference);
      
      setBookingComplete(true);
      setIsLoading(false);
      
      // Display success toast
      toast.success("Booking successful!", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: {
          backgroundColor: "#ffffff",
          color: "#333333"
        }
      });
      
      // Update the parking slot status to booked
      if (selectedSlot) {
        const updatedSlots = parkingSlots.map(slot => {
          if (slot.id === selectedSlot.id) {
            return { ...slot, status: 'occupied' };
          }
          return slot;
        });
        
        setParkingSlots(updatedSlots);
        
        // Update available count
        if (parkingDetails) {
          setParkingDetails(prev => ({
            ...prev,
            availableSlots: prev.availableSlots - 1
          }));
        }
      }
    })
    .catch(error => {
      console.error('Error booking parking spot:', error);
      toast.error('Failed to book parking spot. Please try again.');
      setIsLoading(false);
    });
  };

  // Add to renderContent
  const refreshParkingData = () => {
    setIsLoading(true);
    
    // Reset API connection status to force a fresh attempt
    setIsAPIConnected(false);
    
    // Use the actual API endpoint
    fetch(`${API_BASE_URL}/parking/status`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        // If successful, fetch the full data
        fetchLiveData();
        setLastRefreshTime(new Date().toLocaleTimeString());
        toast.success("Parking data refreshed successfully!");
      })
      .catch(error => {
        console.error('Error refreshing parking data:', error);
        
        // Try the spaces endpoint directly as backup
        fetchLiveData();
        setLastRefreshTime(new Date().toLocaleTimeString());
        toast.info("Using latest available parking data");
      });
  };

  const toggleVideoFeed = () => {
    setShowVideo(!showVideo);
  };

  // Calculate price based on duration
  const calculatePrice = (hours) => {
    return HOURLY_RATE * parseInt(hours);
  };

  // Close button handler for booking confirmation modal
  const handleCloseConfirmation = () => {
    setIsBookingModalOpen(false);
    setBookingComplete(false);
    setSelectedSlot(null);
    setPauseRefresh(false); // Resume auto-refresh
    fetchLiveData();
  };

  // Add handler for card form changes
  const handleCardInputChange = (e) => {
    const { name, value } = e.target;
    setCardForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Add function to handle signup click
  const handleSignupClick = () => {
    setIsLoginModalOpen(false);
    setIsSignupModalOpen(true);
  };
  
  // Add function to handle login click
  const handleLoginClick = () => {
    setIsSignupModalOpen(false);
    setIsLoginModalOpen(true);
  };

  // Add this useEffect to watch for authentication changes
  useEffect(() => {
    // If a slot is selected and user just logged in, show booking modal
    if (selectedSlot && isAuthenticated() && isLoginModalOpen) {
      setIsLoginModalOpen(false);
      setIsBookingModalOpen(true);
      toast.success("Login successful! You can now book your selected slot.");
    }
  }, [isAuthenticated, selectedSlot, isLoginModalOpen]);

  if (isLoading && !parkingDetails) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <Loading size="lg" />
        <p className="mt-4 text-neutral-600 dark:text-neutral-400">Loading parking details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-yellow-400 rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold text-center">SpotSense</h1>
        <p className="text-center text-black mt-1 text-sm">Select and book your exact parking spot</p>
        {isAPIConnected && (
          <div className="flex items-center justify-center mt-2">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-2"></span>
            <span className="text-xs text-black">Live data connected</span>
            {lastRefreshTime && (
              <span className="text-xs text-black ml-4">Last updated: {lastRefreshTime}</span>
            )}
          </div>
        )}
      </div>
      
      {/* Video Feed Toggle Button */}
      <div className="flex justify-end mb-4 space-x-2">
        <Button
          variant="outline"
          size="sm"
          leftIcon={<VideoCameraIcon className="h-4 w-4" />}
          onClick={toggleVideoFeed}
          className="border-yellow-500 text-yellow-600"
        >
          {showVideo ? "Hide Video Feed" : "Show Video Feed"}
        </Button>
        {isAPIConnected && showVideo && (
          <Button
            variant="outline"
            size="sm"
            leftIcon={<AdjustmentsHorizontalIcon className="h-4 w-4" />}
            onClick={toggleDebugMode}
            className={debugMode ? "border-green-500 text-green-600" : "border-gray-500 text-gray-600"}
          >
            {debugMode ? "Disable Debug View" : "Enable Debug View"}
          </Button>
        )}
      </div>
      
      {/* Video Feed Display */}
      {showVideo && (
        <Card 
          title=""
          subtitle=""
          footer=""
          image=""
          onClick={() => {}}
          className="mb-6 overflow-hidden"
        >
          <div className="relative pt-[56.25%]"> {/* 16:9 aspect ratio */}
            {isAPIConnected ? (
              // Use img tag for real-time MJPEG stream from backend
              <img 
                className="absolute top-0 left-0 w-full h-full object-cover"
                src={videoFeed || `${window.location.protocol}//${window.location.hostname}:5000/api/parking/video`}
                alt="Live parking feed"
              />
            ) : (
              // Fallback to local video tag when API is not available
              <video 
                className="absolute top-0 left-0 w-full h-full object-cover"
                src={videoFeed || LOCAL_VIDEOS.main}
                autoPlay
                muted
                loop
                controls
              />
            )}
            <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full flex items-center">
              <EyeIcon className="h-3 w-3 mr-1" />
              <span>{isAPIConnected ? "Live Feed" : "Local Video"}</span>
            </div>
            
            {/* Video controls overlay at bottom */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2">
              <div className="flex flex-wrap justify-between items-center">
                {/* Video sources */}
                <div className="flex items-center space-x-2 mb-1">
                  <span>Source:</span>
                  <div className="flex space-x-1">
                    {videoSources.length > 0 ? (
                      videoSources.map((source) => (
                        <button
                          key={source.id}
                          onClick={() => changeVideoSource(source.id)}
                          className={`px-2 py-1 rounded text-xs ${
                            videoSource === source.id
                              ? 'bg-yellow-500 text-black'
                              : 'bg-gray-700'
                          }`}
                        >
                          {source.name}
                        </button>
                      ))
                    ) : (
                      <>
                        <button
                          onClick={() => changeVideoSource('main')}
                          className={`px-2 py-1 rounded text-xs ${
                            videoSource === 'main' ? 'bg-yellow-500 text-black' : 'bg-gray-700'
                          }`}
                        >
                          Main Parking
                        </button>
                        <button
                          onClick={() => changeVideoSource('reverse')}
                          className={`px-2 py-1 rounded text-xs ${
                            videoSource === 'reverse' ? 'bg-yellow-500 text-black' : 'bg-gray-700'
                          }`}
                        >
                          Reverse Angle
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                {/* View modes - only show when API is connected */}
                {isAPIConnected && (
                  <div className="flex items-center space-x-2 mb-1">
                    <span>View:</span>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => changeViewMode('processed')}
                        className={`px-2 py-1 rounded text-xs ${
                          viewMode === 'processed' ? 'bg-yellow-500 text-black' : 'bg-gray-700'
                        }`}
                      >
                        Processed
                      </button>
                      <button
                        onClick={() => changeViewMode('raw')}
                        className={`px-2 py-1 rounded text-xs ${
                          viewMode === 'raw' ? 'bg-yellow-500 text-black' : 'bg-gray-700'
                        }`}
                      >
                        Raw
                      </button>
                      <button
                        onClick={() => changeViewMode('grayscale')}
                        className={`px-2 py-1 rounded text-xs ${
                          viewMode === 'grayscale' ? 'bg-yellow-500 text-black' : 'bg-gray-700'
                        }`}
                      >
                        Grayscale
                      </button>
                      <button
                        onClick={() => changeViewMode('threshold')}
                        className={`px-2 py-1 rounded text-xs ${
                          viewMode === 'threshold' ? 'bg-yellow-500 text-black' : 'bg-gray-700'
                        }`}
                      >
                        Threshold
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="p-3 bg-gray-100 text-gray-800 text-sm">
            <p className="font-medium">{isAPIConnected ? "Live Video Feed" : "Local Video Playback"}</p>
            <p className="text-xs mt-1">
              {isAPIConnected ? (
                <>
                  • Click on parking spaces in the video to select or deselect them (pink box)
                  <br />
                  • Press 'D' key while viewing to show all processing steps (original, grayscale, threshold, dilated)
                  <br />
                  • Change video source or view type using the controls above
                </>
              ) : (
                <>
                  • Using local video files as the backend is not connected
                  <br />
                  • Switch between Main and Reverse angle views using the controls above
                  <br />
                  • Start the backend server to enable live processing
                </>
              )}
            </p>
          </div>
        </Card>
      )}
      
      {/* Parking Details */}
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/')}
            className="mr-4"
          >
            Back to List
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate(`/parking-detail/${parkingId}`)}
            className="text-yellow-500 border-yellow-500"
          >
            View Parking Details
          </Button>
        </div>
        
        <Card 
          title=""
          subtitle=""
          footer=""
          image=""
          onClick={() => {}}
          className="mb-6 border-none shadow-md overflow-hidden"
        >
          <div className="border-l-4 border-yellow-400 pl-4">
            <div>
              <div className="flex items-start mb-2">
                <MapPinIcon className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5 mr-2" />
                <div>
                  <h2 className="font-semibold text-lg">{parkingDetails?.name}</h2>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm">{parkingDetails?.address}</p>
                </div>
              </div>
              
              <div className="flex items-start mb-2">
                <ClockIcon className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5 mr-2" />
                <div>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm">{parkingDetails?.hours}</p>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm">{parkingDetails?.operatingTime}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
        
        {/* Parking availability */}
        <div className="bg-yellow-100 p-4 rounded-lg mb-6">
          <p className="font-medium text-center">Parking Availability: [{parkingDetails?.availableSlots}/{parkingDetails?.totalSlots}]</p>
          <div className="flex items-center justify-center mt-1">
            <span className="text-xs text-gray-500">
              {pauseRefresh 
                ? "Auto-refresh paused during slot selection" 
                : `Auto-refreshes every ${REFRESH_INTERVAL/1000} seconds`
              }
            </span>
            <Button
              variant="ghost"
              size="xs"
              leftIcon={<ArrowPathIcon className="h-3 w-3" />}
              onClick={refreshParkingData}
              className="ml-2"
            >
              Refresh Now
            </Button>
          </div>
        </div>
      </div>

      {/* Parking Slots Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Select a Parking Slot</h2>
          <Button 
            size="sm" 
            variant="outline" 
            leftIcon={<ArrowPathIcon className="h-4 w-4" />}
            onClick={refreshParkingData}
          >
            Refresh
          </Button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loading />
          </div>
        ) : (
          <>
            {/* Parking slot grid */}
            <div className="grid grid-cols-5 md:grid-cols-10 gap-1 mb-6 bg-yellow-50 p-3 rounded-lg">
              {parkingSlots.map((slot) => (
                <div
                  key={slot.id}
                  className={`
                    h-10 rounded flex items-center justify-center text-sm font-medium 
                    ${slot.status === 'available' 
                      ? selectedSlot && selectedSlot.id === slot.id
                        ? 'bg-yellow-200 text-black cursor-pointer'
                        : 'bg-white border border-gray-300 hover:bg-yellow-100 cursor-pointer'
                      : 'bg-black text-white cursor-not-allowed'
                    }
                  `}
                  onClick={() => handleSlotSelect(slot)}
                >
                  {slot.number}
                </div>
              ))}
            </div>
            
            {/* Selected slot info and book button */}
            <div className="flex justify-between items-center">
              <div>
                {selectedSlot ? (
                  <p className="font-medium">
                    Selected Slot: <span className="text-yellow-600">{selectedSlot.number}</span>
                  </p>
                ) : (
                  <p className="text-neutral-600 dark:text-neutral-400">No slot selected</p>
                )}
              </div>
              <Button 
                variant="primary"
                disabled={!selectedSlot}
                onClick={handleBookClick}
                className="bg-yellow-400 hover:bg-yellow-500 border-yellow-500 text-black flex items-center"
              >
                {!isAuthenticated() && <ShieldCheckIcon className="h-4 w-4 mr-1" />}
                {isAuthenticated() ? "Book Selected Slot" : "Login & Book Selected Slot"}
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Booking Confirmation Modal */}
      <Modal
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setPauseRefresh(false);
          setBookingComplete(false);
        }}
        title={bookingComplete ? "Booking Confirmed!" : "Confirm Booking"}
        size="md"
        footer={
          bookingComplete ? (
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={handleCloseConfirmation}
              >
                Back to Parking
              </Button>
              <Button
                variant="primary"
                onClick={downloadTicket}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Download Ticket
              </Button>
              <Button
                variant="primary"
                onClick={handleGetDirections}
                className="bg-yellow-400 hover:bg-yellow-500 text-black"
              >
                Get Directions
              </Button>
            </div>
          ) : null
        }
      >
        {bookingComplete ? (
          <div className="text-center" ref={ticketRef}>
            <div className="mb-4 flex justify-center">
              <div className="h-16 w-16 rounded-full bg-yellow-400 flex items-center justify-center">
                <CheckCircleIcon className="h-10 w-10 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-4">Your parking has been booked!</h3>
            
            <div className="bg-yellow-50 p-4 rounded-lg mb-6 text-left">
              <div className="grid grid-cols-2 gap-y-3">
                <div className="font-medium">Booking Reference:</div>
                <div className="font-bold">{bookingReference}</div>
                
                <div>Name:</div>
                <div>{bookingForm.name}</div>
                
                <div>Vehicle Number:</div>
                <div>{bookingForm.vehicleNumber}</div>
                
                <div>Vehicle Type:</div>
                <div>{VEHICLE_TYPES.find(v => v.value === bookingForm.vehicleType)?.label}</div>
                
                <div>Parking Spot:</div>
                <div>Slot {selectedSlot?.number}</div>
                
                <div>Duration:</div>
                <div>{DURATION_OPTIONS.find(d => d.value === bookingForm.duration)?.label}</div>
                
                <div>Payment Method:</div>
                <div>{PAYMENT_METHODS.find(p => p.value === bookingForm.paymentMethod)?.label}</div>
                
                <div>Date & Time:</div>
                <div>{new Date().toLocaleString(undefined, { 
                  year: 'numeric', 
                  month: 'numeric', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true
                })}</div>
                
                <div>Rate:</div>
                <div>₹{HOURLY_RATE}/hr</div>
                
                <div>Amount:</div>
                <div>₹{calculatePrice(bookingForm.duration)} (₹{HOURLY_RATE}/hr x {bookingForm.duration} {parseInt(bookingForm.duration) === 1 ? 'hour' : 'hours'})</div>
              </div>
            </div>
            
            <div className="text-gray-600 text-sm">
              A confirmation has been sent to your mobile number: {bookingForm.mobileNumber}
            </div>
          </div>
        ) : (
          <div>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loading size="lg" />
                <p className="mt-4 text-center">Processing your booking...</p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <p>You are about to book:</p>
                  <div className="flex justify-between mt-2 p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <p className="font-medium">{parkingDetails?.name}</p>
                      <p className="text-sm text-gray-600">Slot: {selectedSlot?.number}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">₹{calculatePrice(bookingForm.duration)}</p>
                      <p className="text-sm text-gray-600">
                        {bookingForm.duration} {parseInt(bookingForm.duration) === 1 ? 'hour' : 'hours'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Customer Information Form */}
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Customer Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Full Name <span className="text-red-500">*</span></label>
                      <input 
                        type="text"
                        name="name"
                        value={bookingForm.name}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                        className="w-full p-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Vehicle Number <span className="text-red-500">*</span></label>
                        <input 
                          type="text"
                          name="vehicleNumber"
                          value={bookingForm.vehicleNumber}
                          onChange={handleInputChange}
                          placeholder="e.g. MH02AB1234"
                          className="w-full p-2 border border-gray-300 rounded-md"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Vehicle Type</label>
                        <select
                          name="vehicleType"
                          value={bookingForm.vehicleType}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        >
                          {VEHICLE_TYPES.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Mobile Number <span className="text-red-500">*</span></label>
                        <input 
                          type="tel"
                          name="mobileNumber"
                          value={bookingForm.mobileNumber}
                          onChange={handleInputChange}
                          placeholder="10 digits mobile number"
                          className="w-full p-2 border border-gray-300 rounded-md"
                          maxLength={10}
                          required
                          pattern="[0-9]{10}"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Duration</label>
                        <select
                          name="duration"
                          value={bookingForm.duration}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        >
                          {DURATION_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>{option.label} - ₹{calculatePrice(option.value)}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Payment Method Selection */}
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Payment Method</h4>
                  <div className="space-y-2">
                    {PAYMENT_METHODS.map(method => (
                      <label key={method.value} className="flex items-center p-3 border rounded-md hover:bg-gray-50 cursor-pointer">
                        <input 
                          type="radio"
                          name="paymentMethod"
                          value={method.value}
                          checked={bookingForm.paymentMethod === method.value}
                          onChange={handleInputChange}
                          className="mr-2"
                        />
                        <span>{method.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Payment details based on selected method */}
                {bookingForm.paymentMethod === 'card' && (
                  <div className="mb-4 border-t pt-4">
                    <h4 className="font-medium mb-2">Card Information</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Card Number</label>
                        <input
                          type="text"
                          name="cardNumber"
                          value={cardForm.cardNumber}
                          onChange={handleCardInputChange}
                          placeholder="1234 5678 9012 3456"
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Expiry Date</label>
                          <input
                            type="text"
                            name="expiryDate"
                            value={cardForm.expiryDate}
                            onChange={handleCardInputChange}
                            placeholder="MM/YY"
                            className="w-full p-2 border border-gray-300 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">CVV</label>
                          <input
                            type="text"
                            name="cvv"
                            value={cardForm.cvv}
                            onChange={handleCardInputChange}
                            placeholder="123"
                            className="w-full p-2 border border-gray-300 rounded-md"
                            maxLength={3}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {bookingForm.paymentMethod === 'upi' && (
                  <div className="mb-4 border-t pt-4">
                    <h4 className="font-medium mb-2">UPI Payment</h4>
                    <p className="text-sm text-gray-600 mb-2">You'll receive a payment request on your UPI app after confirmation.</p>
                    <div className="flex items-center justify-center space-x-4 my-4">
                      <img src="/images/upi-icons/gpay.png" alt="Google Pay" className="h-8" />
                      <img src="/images/upi-icons/phonepe.png" alt="PhonePe" className="h-8" />
                      <img src="/images/upi-icons/paytm.png" alt="Paytm" className="h-8" />
                      <img src="/images/upi-icons/bhim.png" alt="BHIM" className="h-8" />
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsBookingModalOpen(false);
                      setPauseRefresh(false);
                    }}
                    className="mr-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleBooking}
                    className="bg-yellow-400 hover:bg-yellow-500 text-black"
                  >
                    Confirm Booking
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
      
      {/* Login Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => {
          setIsLoginModalOpen(false);
          setPauseRefresh(false);
          
          // If user is authenticated and has a slot selected, open booking modal
          if (isAuthenticated() && selectedSlot) {
            setIsBookingModalOpen(true);
          }
        }}
        onSignupClick={handleSignupClick}
      />
      
      {/* Signup Modal */}
      <SignupModal
        isOpen={isSignupModalOpen}
        onClose={() => {
          setIsSignupModalOpen(false);
          setPauseRefresh(false);
        }}
        onLoginClick={() => {
          setIsSignupModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />
      
      {/* Mobile navigation dots */}
      <div className="flex justify-center space-x-2 mt-8">
        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
        <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
      </div>
    </div>
  );
};

export default ParkingSlotPage; 