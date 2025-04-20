import React, { useState } from 'react';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Input,
  Loading,
  LoadingOverlay,
  Modal,
  Pagination,
  Select,
  Tabs,
  Toggle,
  Tooltip
} from '../components/common';

const ComponentsShowcase = () => {
  // States for interactive components
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toggleState, setToggleState] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedOption, setSelectedOption] = useState('');

  // Demo data for components
  const selectOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' }
  ];

  const tabsData = [
    { 
      label: 'Profile', 
      content: (
        <div>
          <h3 className="text-lg font-medium mb-2">User Profile</h3>
          <p>This is the content for the Profile tab.</p>
        </div>
      ) 
    },
    { 
      label: 'Settings', 
      content: (
        <div>
          <h3 className="text-lg font-medium mb-2">User Settings</h3>
          <p>This is the content for the Settings tab.</p>
        </div>
      ) 
    },
    { 
      label: 'Notifications', 
      content: (
        <div>
          <h3 className="text-lg font-medium mb-2">Notifications</h3>
          <p>This is the content for the Notifications tab.</p>
        </div>
      ) 
    }
  ];

  // Loading overlay toggle
  const handleShowLoading = () => {
    setShowLoadingOverlay(true);
    setTimeout(() => setShowLoadingOverlay(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Components Showcase</h1>

      {/* Buttons Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Buttons</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="success">Success</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="warning">Warning</Button>
          <Button variant="info">Info</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="link">Link</Button>
          <Button variant="primary" isLoading>Loading</Button>
          <Button variant="primary" disabled>Disabled</Button>
          <Button variant="primary" leftIcon={<span>👈</span>}>With Icon</Button>
          <Button variant="primary" rightIcon={<span>👉</span>}>With Icon</Button>
        </div>
      </section>

      {/* Cards Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Cards</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card 
            title="Basic Card" 
            subtitle="Card with basic content"
          >
            <p>This is a simple card with a title and some content.</p>
          </Card>
          
          <Card 
            title="Card with Footer" 
            subtitle="Card with a footer section"
            footer={
              <div className="flex justify-end">
                <Button variant="primary" size="sm">Save</Button>
              </div>
            }
          >
            <p>This card includes a footer with actions.</p>
          </Card>
          
          <Card 
            title="Elevated Card" 
            variant="elevated"
            hover={true}
          >
            <p>This card has an elevated style with hover effect.</p>
          </Card>
          
          <Card 
            image="https://images.unsplash.com/photo-1605295626997-df3563432294"
            title="Card with Image" 
            variant="default"
          >
            <p>This card includes an image at the top.</p>
          </Card>
        </div>
      </section>

      {/* Form Elements */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Form Elements</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Input
              label="Text Input"
              id="text-input"
              placeholder="Enter some text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            
            <Select
              label="Select Input"
              id="select-input"
              options={selectOptions}
              value={selectedOption}
              onChange={(e) => setSelectedOption(e.target.value)}
              placeholder="Choose an option"
            />
            
            <div className="mb-4">
              <label className="form-label">Toggle Switch</label>
              <Toggle
                isChecked={toggleState}
                onChange={() => setToggleState(!toggleState)}
                label="Toggle me"
              />
            </div>
          </div>
          
          <div>
            <Input
              label="Input with Error"
              id="error-input"
              placeholder="This input has an error"
              error="This field is required"
            />
            
            <Input
              label="Disabled Input"
              id="disabled-input"
              placeholder="This input is disabled"
              disabled
            />
            
            <div className="flex items-center space-x-4 mt-4">
              <Toggle
                isChecked={toggleState}
                onChange={() => setToggleState(!toggleState)}
                size="sm"
                label="Small"
              />
              
              <Toggle
                isChecked={toggleState}
                onChange={() => setToggleState(!toggleState)}
                size="md"
                label="Medium"
              />
              
              <Toggle
                isChecked={toggleState}
                onChange={() => setToggleState(!toggleState)}
                size="lg"
                label="Large"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Tabs</h2>
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <Tabs tabs={tabsData} />
          </Card>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <h3 className="text-lg font-medium mb-2">Pills Style</h3>
              <Tabs tabs={tabsData} variant="pills" />
            </Card>
            
            <Card>
              <h3 className="text-lg font-medium mb-2">Underline Style</h3>
              <Tabs tabs={tabsData} variant="underline" />
            </Card>
          </div>
        </div>
      </section>

      {/* Alerts */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Alerts</h2>
        <div className="space-y-4">
          <Alert variant="info" title="Information">
            This is an informational alert for the user.
          </Alert>
          
          <Alert variant="success" title="Success">
            Your action was completed successfully.
          </Alert>
          
          <Alert variant="warning" title="Warning">
            Please review the information before proceeding.
          </Alert>
          
          <Alert variant="danger" title="Error" isDismissible>
            There was an error processing your request.
          </Alert>
          
          <Alert variant="neutral">
            A simple neutral message without a title.
          </Alert>
        </div>
      </section>

      {/* Badges */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Badges</h2>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="primary">Primary</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="danger">Danger</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="info">Info</Badge>
            <Badge variant="gray">Gray</Badge>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Badge variant="primary" size="sm">Small</Badge>
            <Badge variant="primary" size="md">Medium</Badge>
            <Badge variant="primary" size="lg">Large</Badge>
          </div>
        </div>
      </section>

      {/* Avatars */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Avatars</h2>
        <div className="space-y-6">
          <div className="flex flex-wrap gap-4 items-end">
            <Avatar size="xs" alt="User Name" />
            <Avatar size="sm" alt="User Name" />
            <Avatar size="md" alt="User Name" />
            <Avatar size="lg" alt="User Name" />
            <Avatar size="xl" alt="User Name" />
            <Avatar size="2xl" alt="User Name" />
          </div>
          
          <div className="flex flex-wrap gap-4">
            <Avatar src="https://i.pravatar.cc/300?img=1" alt="User Name" />
            <Avatar src="https://i.pravatar.cc/300?img=2" alt="User Name" status="online" />
            <Avatar src="https://i.pravatar.cc/300?img=3" alt="User Name" status="offline" />
            <Avatar src="https://i.pravatar.cc/300?img=4" alt="User Name" status="busy" />
            <Avatar src="https://i.pravatar.cc/300?img=5" alt="User Name" status="away" />
          </div>
          
          <div className="flex flex-wrap gap-4">
            <Avatar alt="John Doe" />
            <Avatar alt="Jane Smith" />
            <Avatar alt="Alex Johnson" />
            <Avatar alt="Sarah Williams" />
          </div>
        </div>
      </section>

      {/* Loading */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Loading Indicators</h2>
        <div className="space-y-6">
          <div className="flex flex-wrap gap-6 items-center">
            <Loading size="sm" />
            <Loading size="md" />
            <Loading size="lg" />
          </div>
          
          <Button onClick={handleShowLoading}>
            Show Loading Overlay
          </Button>
          
          {showLoadingOverlay && <LoadingOverlay message="Loading data..." />}
        </div>
      </section>

      {/* Tooltip */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Tooltips</h2>
        <div className="flex justify-center gap-8 py-12">
          <Tooltip content="This is a top tooltip" position="top">
            <Button variant="outline">Hover me (top)</Button>
          </Tooltip>
          
          <Tooltip content="This is a bottom tooltip" position="bottom">
            <Button variant="outline">Hover me (bottom)</Button>
          </Tooltip>
          
          <Tooltip content="This is a tooltip with a longer description that wraps to multiple lines" position="right">
            <Button variant="outline">Hover me (right)</Button>
          </Tooltip>
        </div>
      </section>

      {/* Modal */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Modal</h2>
        <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
        
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Example Modal"
          footer={
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => setIsModalOpen(false)}>Confirm</Button>
            </div>
          }
        >
          <p>This is an example modal dialog. You can put any content here.</p>
          <p className="mt-4">Click the X button or the Cancel button to close.</p>
        </Modal>
      </section>

      {/* Pagination */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Pagination</h2>
        <Pagination
          currentPage={currentPage}
          totalPages={10}
          onPageChange={setCurrentPage}
        />
      </section>
    </div>
  );
};

export default ComponentsShowcase; 