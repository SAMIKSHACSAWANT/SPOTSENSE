import React from 'react';
import { MapPinIcon, ClockIcon, ShieldCheckIcon, CameraIcon, LightBulbIcon, BoltIcon } from '@heroicons/react/24/outline';

const AboutPage = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-yellow-400 rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold text-center">About SpotSense</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Our Mission</h2>
        <p className="text-gray-700 mb-4">
          At SpotSense, we are redefining urban mobility by addressing one of the most pressing challenges in modern cities — parking. Through the power of advanced computer vision and intelligent automation, our smart parking system detects real-time availability with precision, enabling drivers to locate and reserve parking spaces effortlessly.
        </p>
        <p className="text-gray-700 mb-4">
          Our mission is to ease urban congestion, minimize environmental impact, and eliminate the daily frustration of circling for parking. By streamlining the parking experience, we create value not only for drivers but also for parking facility operators and city planners aiming for smarter infrastructure.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">How It Works</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="flex">
            <div className="flex-shrink-0 mr-4">
              <CameraIcon className="h-8 w-8 text-yellow-500" />
            </div>
            <div>
              <h3 className="font-medium mb-2">🧠 Smart Detection</h3>
              <p className="text-gray-600 text-sm">
                Our intelligent computer vision system continuously analyzes live video feeds from parking areas to accurately identify vacant and occupied spaces.
              </p>
            </div>
          </div>
          <div className="flex">
            <div className="flex-shrink-0 mr-4">
              <MapPinIcon className="h-8 w-8 text-yellow-500" />
            </div>
            <div>
              <h3 className="font-medium mb-2">📍 Seamless Location Discovery</h3>
              <p className="text-gray-600 text-sm">
                Drivers can instantly discover nearby parking zones with real-time space availability displayed at their fingertips.
              </p>
            </div>
          </div>
          <div className="flex">
            <div className="flex-shrink-0 mr-4">
              <BoltIcon className="h-8 w-8 text-yellow-500" />
            </div>
            <div>
              <h3 className="font-medium mb-2">⚡ Instant Booking</h3>
              <p className="text-gray-600 text-sm">
                Reserve your spot in seconds through our intuitive app and receive a secure digital pass — no hassle, no delay.
              </p>
            </div>
          </div>
          <div className="flex">
            <div className="flex-shrink-0 mr-4">
              <ShieldCheckIcon className="h-8 w-8 text-yellow-500" />
            </div>
            <div>
              <h3 className="font-medium mb-2">🔐 End-to-End Security</h3>
              <p className="text-gray-600 text-sm">
                All user data, including booking and payment details, is protected through robust encryption protocols, ensuring complete privacy and security.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Our Technology</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="flex">
            <div className="flex-shrink-0 mr-4">
              <LightBulbIcon className="h-8 w-8 text-yellow-500" />
            </div>
            <div>
              <h3 className="font-medium mb-2">🤖 AI & Computer Vision</h3>
              <p className="text-gray-600 text-sm">
                Harnessing advanced machine learning and image processing, SpotSense delivers fast, reliable, and highly accurate space detection.
              </p>
            </div>
          </div>
          <div className="flex">
            <div className="flex-shrink-0 mr-4">
              <ClockIcon className="h-8 w-8 text-yellow-500" />
            </div>
            <div>
              <h3 className="font-medium mb-2">⏱️ Real-Time Intelligence</h3>
              <p className="text-gray-600 text-sm">
                Our system refreshes data every few seconds, offering up-to-the-moment parking availability to support smooth and efficient navigation.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile navigation dots */}
      <div className="flex justify-center space-x-2 mt-8">
        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
        <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
      </div>
    </div>
  );
};

export default AboutPage; 