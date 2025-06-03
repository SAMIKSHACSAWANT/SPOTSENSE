import React, { useState } from 'react';
import { PhoneIcon, EnvelopeIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { Button, Input, Loading } from '../components/common';
import { toast } from 'react-toastify';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!validateEmail(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      toast.success('Your message has been sent successfully!');
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: ''
      });
      setIsSubmitting(false);
    }, 1500);
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-yellow-400 rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold text-center">Contact Us</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-6">Get in Touch</h2>
            <p className="text-gray-700 mb-6">
              Have questions about SpotSense? We&apos;re here to help. Fill out the form and our team will get back to you as soon as possible.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <PhoneIcon className="h-6 w-6 text-yellow-500 mr-3" />
                </div>
                <div>
                  <h3 className="font-medium">Phone</h3>
                  <p className="text-gray-600">+91 22 1234 5678</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <EnvelopeIcon className="h-6 w-6 text-yellow-500 mr-3" />
                </div>
                <div>
                  <h3 className="font-medium">Email</h3>
                  <p className="text-gray-600">support@SpotSense.com</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <MapPinIcon className="h-6 w-6 text-yellow-500 mr-3" />
                </div>
                <div>
                  <h3 className="font-medium">Address</h3>
                  <p className="text-gray-600">
                    123 Tech Park, Andheri East<br />
                    Mumbai, Maharashtra 400069<br />
                    India
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Business Hours</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Monday - Friday:</span>
                <span className="font-medium">9:00 AM - 6:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Saturday:</span>
                <span className="font-medium">10:00 AM - 4:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Sunday:</span>
                <span className="font-medium">Closed</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6">Send a Message</h2>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Your email address"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Your phone number (optional)"
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="How can we help you?"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white"
                  required
                />
              </div>
              
              <div>
                <Button
                  type="submit"
                  fullWidth
                  isLoading={isSubmitting}
                  loadingText="Sending..."
                  className="bg-yellow-400 hover:bg-yellow-500 border-yellow-500 text-black"
                >
                  Send Message
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Mobile navigation dots */}
      <div className="flex justify-center space-x-2 mt-8">
        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
        <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
      </div>
    </div>
  );
};

export default ContactPage; 