// Global variables
let map;
let userLocation;
let markers = [];
let selectedParkingLot = null;
let parkingSlots = [];
let selectedSlot = null;
let updateInterval;

// DOM Elements
const homePage = document.getElementById('home-page');
const parkingSlotPage = document.getElementById('parking-slot-page');
const bookingModal = document.getElementById('booking-modal');
const ticketModal = document.getElementById('ticket-modal');
const currentLocationText = document.getElementById('current-location');
const parkingLotsContainer = document.getElementById('parking-lots');
const parkingNameElement = document.getElementById('parking-name');
const parkingAddressElement = document.getElementById('parking-address');
const parkingDistanceElement = document.getElementById('parking-distance');
const parkingPriceElement = document.getElementById('parking-price');
const availableCountElement = document.getElementById('available-count');
const totalCountElement = document.getElementById('total-count');
const slotsContainer = document.getElementById('slots-container');
const lastUpdatedElement = document.getElementById('last-updated');
const modalSlotNumber = document.getElementById('modal-slot-number');
const bookingForm = document.getElementById('booking-form');
const vehicleNumberInput = document.getElementById('vehicle-number');

// API Endpoints (simulated)
const API_BASE_URL = 'https://api.parksmart.com';
const API_ENDPOINTS = {
    PARKING_LOTS: `${API_BASE_URL}/api/parkinglots`,
    SLOTS: `${API_BASE_URL}/api/slots`,
    BOOK: `${API_BASE_URL}/api/book`,
    SLOT_STATUS: `${API_BASE_URL}/api/slot-status-live`
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

// Initialize the application
function initializeApp() {
    getUserLocation();
    initializeMap();
    setupFormValidation();
}

// Get user's current location
function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                // Update location in UI
                reverseGeocode(userLocation);
                
                // Update map and fetch nearby parking
                if (map) {
                    map.setCenter(userLocation);
                    fetchNearbyParkingLots(userLocation);
                }
            },
            (error) => {
                console.error('Error getting location:', error);
                // Default location - Mumbai
                userLocation = { lat: 19.0760, lng: 72.8777 };
                currentLocationText.textContent = 'Mumbai, India';
                
                // Update map and fetch nearby parking
                if (map) {
                    map.setCenter(userLocation);
                    fetchNearbyParkingLots(userLocation);
                }
            }
        );
    } else {
        console.error('Geolocation is not supported by this browser.');
        // Default location - Mumbai
        userLocation = { lat: 19.0760, lng: 72.8777 };
        currentLocationText.textContent = 'Mumbai, India';
    }
}

// Reverse geocode coordinates to address
function reverseGeocode(location) {
    const geocoder = new google.maps.Geocoder();
    
    geocoder.geocode({ location: location }, (results, status) => {
        if (status === 'OK' && results[0]) {
            // Extract city and country
            let city = '';
            let area = '';
            
            for (const component of results[0].address_components) {
                if (component.types.includes('locality')) {
                    city = component.long_name;
                }
                if (component.types.includes('sublocality_level_1')) {
                    area = component.long_name;
                }
            }
            
            currentLocationText.textContent = city ? `${area ? area + ', ' : ''}${city}` : 'Current Location';
        } else {
            currentLocationText.textContent = 'Current Location';
        }
    });
}

// Initialize Google Map
function initializeMap() {
    const mapOptions = {
        zoom: 14,
        center: userLocation || { lat: 19.0760, lng: 72.8777 }, // Default: Mumbai
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
            {
                featureType: 'poi.business',
                stylers: [{ visibility: 'off' }]
            },
            {
                featureType: 'transit',
                elementType: 'labels.icon',
                stylers: [{ visibility: 'off' }]
            }
        ]
    };
    
    map = new google.maps.Map(document.getElementById('map-container'), mapOptions);
    
    // Add user location marker if available
    if (userLocation) {
        new google.maps.Marker({
            position: userLocation,
            map: map,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: '#4f46e5',
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: '#ffffff'
            },
            title: 'Your Location'
        });
    }
    
    // Fetch nearby parking lots
    fetchNearbyParkingLots(userLocation || mapOptions.center);
}

// Fetch nearby parking lots
function fetchNearbyParkingLots(location) {
    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    markers = [];
    
    // In a real app, you would call the API with the location
    // For demo purposes, we'll simulate the API response
    simulateFetchParkingLots(location)
        .then(data => {
            renderParkingLots(data.parkingLots);
            
            // Add markers to the map
            data.parkingLots.forEach(lot => {
                addMarker(lot);
            });
        })
        .catch(error => {
            console.error('Error fetching parking lots:', error);
            parkingLotsContainer.innerHTML = `
                <div class="col-span-full text-center py-8">
                    <i class="fas fa-exclamation-circle text-gray-400 text-4xl mb-4"></i>
                    <p class="text-gray-500">Error loading parking lots. Please try again.</p>
                </div>
            `;
        });
}

// Simulate API call to fetch parking lots
function simulateFetchParkingLots(location) {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Generate synthetic parking lots
            const parkingLots = [
                {
                    id: 'p1',
                    name: 'Nakshatra Mall Parking',
                    address: '385, N C Kelkar Marg, Dadar West, Mumbai, Maharashtra 400028',
                    location: { lat: location.lat + 0.01, lng: location.lng - 0.01 },
                    distance: '1.2 km',
                    totalSpots: 70,
                    availableSpots: 15,
                    price: '₹40/hour',
                    priceValue: 40,
                    type: 'mall',
                    rating: 4.2,
                    image: 'https://source.unsplash.com/Okm0UV_CtLI/600x400'
                },
                {
                    id: 'p2',
                    name: 'Metro Station Parking',
                    address: 'Jagannath Bhatankar Marg, Lower Parel, Mumbai, Maharashtra 400013',
                    location: { lat: location.lat - 0.008, lng: location.lng + 0.005 },
                    distance: '0.8 km',
                    totalSpots: 50,
                    availableSpots: 8,
                    price: '₹30/hour',
                    priceValue: 30,
                    type: 'public',
                    rating: 3.8,
                    image: 'https://source.unsplash.com/P_0Wd_I6eFk/600x400'
                },
                {
                    id: 'p3',
                    name: 'Downtown Secure Parking',
                    address: 'Senapati Bapat Marg, Lower Parel, Mumbai, Maharashtra 400013',
                    location: { lat: location.lat + 0.005, lng: location.lng + 0.008 },
                    distance: '1.5 km',
                    totalSpots: 100,
                    availableSpots: 42,
                    price: '₹50/hour',
                    priceValue: 50,
                    type: 'premium',
                    rating: 4.5,
                    image: 'https://source.unsplash.com/mpn7xjKQ_Ns/600x400'
                },
                {
                    id: 'p4',
                    name: 'Hospital Parking Zone',
                    address: 'Dr E Borges Rd, Parel, Mumbai, Maharashtra 400012',
                    location: { lat: location.lat - 0.005, lng: location.lng - 0.007 },
                    distance: '1.1 km',
                    totalSpots: 30,
                    availableSpots: 5,
                    price: '₹25/hour',
                    priceValue: 25,
                    type: 'hospital',
                    rating: 3.5,
                    image: 'https://source.unsplash.com/ZUSMg1Xuo04/600x400'
                }
            ];
            
            resolve({ parkingLots });
        }, 1000);
    });
}

// Render parking lots in the UI
function renderParkingLots(parkingLots) {
    // Clear existing content
    parkingLotsContainer.innerHTML = '';
    
    // Render each parking lot
    parkingLots.forEach(lot => {
        const cardHTML = `
            <div class="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 card-hover">
                <img src="${lot.image}" alt="${lot.name}" class="w-full h-48 object-cover">
                <div class="p-4">
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="text-lg font-semibold text-gray-900 mb-1">${lot.name}</h3>
                            <p class="text-sm text-gray-600 mb-2">${lot.address}</p>
                        </div>
                        <span class="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">${lot.rating} ⭐</span>
                    </div>
                    <div class="flex justify-between items-center mb-4">
                        <span class="text-sm text-gray-600">
                            <i class="fas fa-map-marker-alt text-indigo-600 mr-1"></i>
                            ${lot.distance}
                        </span>
                        <span class="text-sm font-medium text-indigo-600">${lot.price}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-sm ${lot.availableSpots > 5 ? 'text-green-600' : 'text-orange-600'}">
                            <i class="fas fa-parking mr-1"></i>
                            ${lot.availableSpots} spots available
                        </span>
                        <button data-id="${lot.id}" class="book-now-btn bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                            Book Now
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        parkingLotsContainer.innerHTML += cardHTML;
    });
    
    // Add event listeners to book buttons
    document.querySelectorAll('.book-now-btn').forEach(button => {
        button.addEventListener('click', function() {
            const lotId = this.getAttribute('data-id');
            const lot = parkingLots.find(l => l.id === lotId);
            
            if (lot) {
                selectedParkingLot = lot;
                showParkingSlotPage(lot);
            }
        });
    });
}

// Add marker to the map
function addMarker(lot) {
    const marker = new google.maps.Marker({
        position: lot.location,
        map: map,
        title: lot.name,
        icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r="18" fill="#4f46e5" stroke="white" stroke-width="2"/>
                    <text x="50%" y="50%" dy=".3em" font-family="Arial" font-size="20" fill="white" text-anchor="middle">P</text>
                </svg>
            `),
            scaledSize: new google.maps.Size(40, 40)
        }
    });
    
    marker.addListener('click', () => {
        selectedParkingLot = lot;
        showParkingSlotPage(lot);
    });
    
    markers.push(marker);
}

// Show parking slot page
function showParkingSlotPage(parkingLot) {
    // Update UI elements
    parkingNameElement.textContent = parkingLot.name;
    parkingAddressElement.innerHTML = `<i class="fas fa-map-marker-alt text-indigo-600 mr-2"></i>${parkingLot.address}`;
    parkingDistanceElement.innerHTML = `<i class="fas fa-route text-indigo-600 mr-2"></i>${parkingLot.distance} from your location`;
    parkingPriceElement.innerHTML = `<i class="fas fa-tag text-indigo-600 mr-2"></i>${parkingLot.price}`;
    
    // Hide home page, show parking slot page
    homePage.classList.add('hidden');
    parkingSlotPage.classList.remove('hidden');
    
    // Fetch and render parking slots
    fetchParkingSlots(parkingLot.id);
    
    // Set up refresh interval
    setupRefreshInterval(parkingLot.id);
}

// Setup refresh interval for parking slots
function setupRefreshInterval(parkingId) {
    // Clear any existing interval
    if (updateInterval) {
        clearInterval(updateInterval);
    }
    
    // Set new interval
    updateInterval = setInterval(() => {
        fetchParkingSlots(parkingId, true);
        
        // Update last updated text
        const now = new Date();
        lastUpdatedElement.textContent = `Last updated at ${now.toLocaleTimeString()}`;
    }, 10000); // 10 seconds
}

// Fetch parking slots
function fetchParkingSlots(parkingId, isUpdate = false) {
    if (!isUpdate) {
        // Show loading state on initial load
        slotsContainer.innerHTML = `
            <div class="flex flex-wrap justify-center w-full animate-pulse">
                ${Array(16).fill().map(() => '<div class="bg-gray-200 w-14 h-14 m-1 rounded"></div>').join('')}
            </div>
        `;
    }
    
    // In a real app, you would call the API with the parkingId
    // For demo purposes, we'll simulate the API response
    simulateFetchParkingSlots(parkingId)
        .then(data => {
            // Update total and available counts
            availableCountElement.textContent = data.availableSpots;
            totalCountElement.textContent = data.totalSpots;
            
            // Store slots data
            parkingSlots = data.slots;
            
            // Render parking slots
            renderParkingSlots(data.slots, isUpdate);
        })
        .catch(error => {
            console.error('Error fetching parking slots:', error);
            slotsContainer.innerHTML = `
                <div class="w-full text-center py-8">
                    <i class="fas fa-exclamation-circle text-gray-400 text-4xl mb-4"></i>
                    <p class="text-gray-500">Error loading parking slots. Please try again.</p>
                </div>
            `;
        });
}

// Simulate API call to fetch parking slots
function simulateFetchParkingSlots(parkingId) {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Generate synthetic parking slots
            const slots = Array.from({ length: 70 }, (_, index) => {
                // Simulate some slots being occupied
                const isOccupied = Math.random() < 0.3; // 30% chance of being occupied
                
                return {
                    id: index.toString(),
                    status: isOccupied ? 'occupied' : 'available'
                };
            });
            
            const availableSpots = slots.filter(slot => slot.status === 'available').length;
            
            resolve({
                parkingId,
                totalSpots: slots.length,
                availableSpots,
                slots
            });
        }, 1000);
    });
}

// Render parking slots
function renderParkingSlots(slots, isUpdate = false) {
    if (!isUpdate) {
        // Clear existing content on initial load
        slotsContainer.innerHTML = '';
    }
    
    // If first render or significant change, rebuild the entire grid
    if (!isUpdate || shouldRebuildGrid(slots)) {
        slotsContainer.innerHTML = '';
        
        // Render each parking slot
        slots.forEach(slot => {
            const slotElement = document.createElement('div');
            slotElement.className = `parking-slot ${slot.status} flex items-center justify-center`;
            slotElement.textContent = slot.id;
            slotElement.dataset.id = slot.id;
            slotElement.dataset.status = slot.status;
            
            if (selectedSlot && selectedSlot.id === slot.id) {
                slotElement.classList.add('selected', 'pulse');
            }
            
            // Add click event only for available slots
            if (slot.status === 'available') {
                slotElement.addEventListener('click', () => {
                    selectParkingSlot(slot);
                });
            }
            
            slotsContainer.appendChild(slotElement);
        });
    } else {
        // Just update the status of each slot
        slots.forEach(slot => {
            const slotElement = slotsContainer.querySelector(`.parking-slot[data-id="${slot.id}"]`);
            
            if (slotElement) {
                // Update class and dataset if status changed
                if (slotElement.dataset.status !== slot.status) {
                    slotElement.classList.remove('available', 'occupied');
                    slotElement.classList.add(slot.status);
                    slotElement.dataset.status = slot.status;
                    
                    // Update click event based on new status
                    if (slot.status === 'available') {
                        slotElement.addEventListener('click', () => {
                            selectParkingSlot(slot);
                        });
                    } else {
                        slotElement.removeEventListener('click', () => {});
                    }
                    
                    // If this was the selected slot and is now occupied, deselect it
                    if (selectedSlot && selectedSlot.id === slot.id && slot.status === 'occupied') {
                        selectedSlot = null;
                        slotElement.classList.remove('selected', 'pulse');
                    }
                }
            }
        });
    }
    
    // Update last updated text
    const now = new Date();
    lastUpdatedElement.textContent = `Last updated at ${now.toLocaleTimeString()}`;
}

// Determine if we should rebuild the entire grid
function shouldRebuildGrid(newSlots) {
    // If we don't have any elements yet, definitely rebuild
    const existingSlots = slotsContainer.querySelectorAll('.parking-slot');
    if (existingSlots.length === 0) return true;
    
    // If the number of slots has changed, rebuild
    if (existingSlots.length !== newSlots.length) return true;
    
    // If more than 25% of slots have changed status, rebuild for performance
    let changedCount = 0;
    existingSlots.forEach(el => {
        const id = el.dataset.id;
        const newSlot = newSlots.find(s => s.id === id);
        if (newSlot && el.dataset.status !== newSlot.status) {
            changedCount++;
        }
    });
    
    return changedCount > (newSlots.length * 0.25);
}

// Select a parking slot
function selectParkingSlot(slot) {
    // Deselect previously selected slot
    if (selectedSlot) {
        const prevSlotElement = slotsContainer.querySelector(`.parking-slot[data-id="${selectedSlot.id}"]`);
        if (prevSlotElement) {
            prevSlotElement.classList.remove('selected', 'pulse');
        }
    }
    
    // Select new slot
    selectedSlot = slot;
    const slotElement = slotsContainer.querySelector(`.parking-slot[data-id="${slot.id}"]`);
    if (slotElement) {
        slotElement.classList.add('selected', 'pulse');
    }
    
    // Show booking modal
    showBookingModal(slot);
}

// Show booking modal
function showBookingModal(slot) {
    // Update slot number in modal
    modalSlotNumber.textContent = `Slot #${slot.id}`;
    
    // Set default date and time
    const now = new Date();
    const dateInput = document.getElementById('booking-date');
    const timeInput = document.getElementById('booking-time');
    
    dateInput.valueAsDate = now;
    timeInput.value = now.toTimeString().substring(0, 5);
    
    // Show modal
    bookingModal.classList.remove('hidden');
}

// Setup form validation
function setupFormValidation() {
    // Vehicle number validation using regex
    vehicleNumberInput.addEventListener('input', function() {
        const regex = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/;
        const isValid = regex.test(this.value);
        
        if (this.value && !isValid) {
            this.classList.add('border-red-500');
            this.classList.remove('border-green-500');
        } else if (this.value && isValid) {
            this.classList.remove('border-red-500');
            this.classList.add('border-green-500');
        } else {
            this.classList.remove('border-red-500', 'border-green-500');
        }
    });
}

// Process booking form
function processBookingForm(event) {
    event.preventDefault();
    
    // Get form data
    const name = document.getElementById('name').value;
    const vehicleNumber = document.getElementById('vehicle-number').value;
    const bookingDate = document.getElementById('booking-date').value;
    const bookingTime = document.getElementById('booking-time').value;
    const duration = document.getElementById('duration').value;
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
    
    // Validate vehicle number
    const regex = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/;
    if (!regex.test(vehicleNumber)) {
        alert('Please enter a valid vehicle number (e.g. MH12AB1234)');
        return;
    }
    
    // Create booking object
    const booking = {
        slotId: selectedSlot.id,
        parkingId: selectedParkingLot.id,
        name,
        vehicleNumber,
        bookingDate,
        bookingTime,
        duration,
        paymentMethod
    };
    
    // In a real app, you would call the API to create the booking
    // For demo purposes, we'll simulate the API response
    simulateCreateBooking(booking)
        .then(response => {
            // Hide booking modal
            bookingModal.classList.add('hidden');
            
            // Update parking slot status
            updateSlotStatus(selectedSlot.id, 'occupied');
            
            // Show ticket with booking details
            showTicket(response.booking);
        })
        .catch(error => {
            console.error('Error creating booking:', error);
            alert('Error creating booking. Please try again.');
        });
}

// Simulate API call to create booking
function simulateCreateBooking(booking) {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Generate booking reference
            const bookingRef = 'TKT-' + Math.random().toString(36).substring(2, 10).toUpperCase();
            
            // Calculate amount
            const hourlyRate = selectedParkingLot.priceValue;
            const hours = parseInt(booking.duration);
            const amount = hourlyRate * hours;
            
            // Format date and time
            const bookingDateTime = new Date(`${booking.bookingDate}T${booking.bookingTime}`);
            
            const response = {
                success: true,
                booking: {
                    ...booking,
                    bookingRef,
                    amount,
                    formattedDateTime: bookingDateTime.toLocaleString(),
                    formattedDate: bookingDateTime.toLocaleDateString(),
                    formattedTime: bookingDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
            };
            
            resolve(response);
        }, 1000);
    });
}

// Update slot status
function updateSlotStatus(slotId, status) {
    // Update local data
    const slot = parkingSlots.find(s => s.id === slotId);
    if (slot) {
        slot.status = status;
        
        // Update UI
        const slotElement = slotsContainer.querySelector(`.parking-slot[data-id="${slotId}"]`);
        if (slotElement) {
            slotElement.classList.remove('available', 'occupied');
            slotElement.classList.add(status);
            slotElement.dataset.status = status;
        }
        
        // Update counts
        const availableCount = parkingSlots.filter(s => s.status === 'available').length;
        availableCountElement.textContent = availableCount;
    }
}

// Show ticket
function showTicket(booking) {
    // Update ticket details
    document.getElementById('ticket-id').textContent = booking.bookingRef;
    document.getElementById('ticket-date').textContent = booking.formattedDate;
    document.getElementById('ticket-name').textContent = booking.name;
    document.getElementById('ticket-vehicle').textContent = booking.vehicleNumber;
    document.getElementById('ticket-slot').textContent = booking.slotId;
    document.getElementById('ticket-time').textContent = booking.formattedTime;
    document.getElementById('ticket-duration').textContent = `${booking.duration} Hour${booking.duration > 1 ? 's' : ''}`;
    document.getElementById('ticket-payment').textContent = booking.paymentMethod.toUpperCase();
    document.getElementById('ticket-amount').textContent = `₹${booking.amount.toFixed(2)}`;
    
    // Show ticket modal
    ticketModal.classList.remove('hidden');
}

// Download ticket as PDF
function downloadTicket() {
    alert('In a production app, this would generate and download a PDF ticket.');
    // In a real app, you would use a library like jsPDF or html2canvas
    // to generate a PDF from the ticket element
}

// Set up event listeners
function setupEventListeners() {
    // Back button
    document.getElementById('back-to-home').addEventListener('click', () => {
        homePage.classList.remove('hidden');
        parkingSlotPage.classList.add('hidden');
        
        // Clear refresh interval
        if (updateInterval) {
            clearInterval(updateInterval);
        }
    });
    
    // Get directions button
    document.getElementById('get-directions-btn').addEventListener('click', () => {
        if (selectedParkingLot) {
            const { lat, lng } = selectedParkingLot.location;
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
        }
    });
    
    // Booking modal cancel button
    document.getElementById('cancel-booking').addEventListener('click', () => {
        bookingModal.classList.add('hidden');
        
        // Deselect slot
        if (selectedSlot) {
            const slotElement = slotsContainer.querySelector(`.parking-slot[data-id="${selectedSlot.id}"]`);
            if (slotElement) {
                slotElement.classList.remove('selected', 'pulse');
            }
            selectedSlot = null;
        }
    });
    
    // Booking form submit
    bookingForm.addEventListener('submit', processBookingForm);
    
    // Close ticket modal
    document.getElementById('close-ticket').addEventListener('click', () => {
        ticketModal.classList.add('hidden');
    });
    
    // Download ticket
    document.getElementById('download-ticket').addEventListener('click', downloadTicket);
    
    // Get directions from ticket
    document.getElementById('ticket-directions').addEventListener('click', () => {
        if (selectedParkingLot) {
            const { lat, lng } = selectedParkingLot.location;
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
        }
    });
} 