import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common';

const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary-600 dark:text-primary-400 mb-4">404</h1>
        <h2 className="text-3xl font-semibold mb-4">Page Not Found</h2>
        <p className="text-neutral-600 dark:text-neutral-400 mb-8 max-w-md mx-auto">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <Link to="/">
          <Button variant="primary">
            Go Back Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage; 