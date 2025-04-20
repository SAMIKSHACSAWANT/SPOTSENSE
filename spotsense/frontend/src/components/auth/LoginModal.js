import React, { useState } from 'react';
import { Modal, Input, Button } from '../common';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const LoginModal = ({ isOpen, onClose, onSignupClick }) => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        toast.success("Login successful!");
        onClose();
      } else {
        toast.error(result.message || "Login failed");
      }
    } catch (error) {
      toast.error("An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  const switchToSignup = (e) => {
    e.preventDefault();
    onSignupClick();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Log In"
      size="sm"
      footer={
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="mr-2"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            isLoading={loading}
            className="bg-yellow-400 hover:bg-yellow-500 text-black"
          >
            Log In
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit}>
        <Input
          label="Email"
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter your email"
          required
        />
        
        <Input
          label="Password"
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Enter your password"
          required
        />
        
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don&apos;t have an account?{" "}
            <a 
              href="#" 
              onClick={switchToSignup}
              className="text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300"
            >
              Sign up
            </a>
          </p>
        </div>
      </form>
    </Modal>
  );
};

export default LoginModal; 