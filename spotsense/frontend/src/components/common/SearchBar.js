import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

// Sample suggestions for parking locations
const PARKING_SUGGESTIONS = [
  { id: 'rcity_mall', name: 'R-City Mall Parking', area: 'Ghatkopar', highlighted: true },
  { id: 'p1', name: 'Nakshatra Mall Parking', area: 'Dadar West' },
  { id: 'p2', name: 'Metro Station Parking', area: 'Andheri East' },
  { id: 'p3', name: 'Downtown Secure Parking', area: 'Powai' },
  { id: 'p4', name: 'Hospital Parking Zone', area: 'Bandra' },
  { id: 'p5', name: 'R-City Mall Parking', area: 'Ghatkopar' },
  { id: 'p6', name: 'Infiniti Mall Parking', area: 'Malad West' },
  { id: 'p7', name: 'Phoenix Marketcity Parking', area: 'Kurla West' },
  { id: 'p8', name: 'Viviana Mall Parking', area: 'Thane West' }
];

const SearchBar = ({ className = '' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);
  const navigate = useNavigate();

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter suggestions based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSuggestions([]);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    
    // Special handling for "rcity" or "r-city" to prioritize R-City Mall
    if (query.includes('rcity') || query.includes('r-city')) {
      const rcitySuggestions = PARKING_SUGGESTIONS.filter(
        suggestion => suggestion.name.toLowerCase().includes('r-city')
      );
      setSuggestions(rcitySuggestions);
      return;
    }
    
    const filteredSuggestions = PARKING_SUGGESTIONS.filter(
      suggestion => 
        suggestion.name.toLowerCase().includes(query) || 
        suggestion.area.toLowerCase().includes(query)
    );
    
    // Sort suggestions to prioritize exact matches
    filteredSuggestions.sort((a, b) => {
      const aNameMatch = a.name.toLowerCase().includes(query);
      const bNameMatch = b.name.toLowerCase().includes(query);
      
      if (aNameMatch && !bNameMatch) return -1;
      if (!aNameMatch && bNameMatch) return 1;
      return 0;
    });
    
    setSuggestions(filteredSuggestions);
  }, [searchQuery]);

  const handleSubmit = (e) => {
    e.preventDefault();
    performSearch();
  };

  const performSearch = (parkingId) => {
    // If a specific parking ID is provided, go directly to that parking
    if (parkingId) {
      navigate(`/parking/${parkingId}`);
      setSearchQuery('');
      setShowSuggestions(false);
      return;
    }
    
    // Special case for R-City Mall
    if (searchQuery.toLowerCase().includes('rcity') || searchQuery.toLowerCase().includes('r-city')) {
      navigate('/parking/rcity_mall');
      setSearchQuery('');
      setShowSuggestions(false);
      return;
    }
    
    // Otherwise, go to the nearby malls page with the search query
    if (searchQuery.trim()) {
      navigate(`/nearby-malls?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setShowSuggestions(false);
    } else {
      // If search is empty, just go to the nearby malls page
      navigate('/nearby-malls');
    }
  };

  const handleSuggestionClick = (parkingId) => {
    performSearch(parkingId);
  };

  return (
    <div className="relative w-full" ref={suggestionsRef}>
      <form 
        onSubmit={handleSubmit} 
        className={`flex items-center relative ${className}`}
      >
        <input
          type="text"
          placeholder="Find nearest parking... (e.g. R-City Mall)"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          className="form-input pr-10 py-1.5 text-sm w-full"
        />
        <button
          type="submit"
          className="absolute right-2 text-gray-400 hover:text-gray-600"
          aria-label="Search"
        >
          <MagnifyingGlassIcon className="h-5 w-5" />
        </button>
      </form>
      
      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          <ul>
            {suggestions.map((suggestion) => (
              <li 
                key={suggestion.id}
                className={`px-4 py-2 hover:bg-yellow-50 cursor-pointer ${suggestion.highlighted ? 'bg-yellow-50' : ''}`}
                onClick={() => handleSuggestionClick(suggestion.id)}
              >
                <div className="font-medium">{suggestion.name}</div>
                <div className="text-xs text-gray-500">{suggestion.area}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchBar; 