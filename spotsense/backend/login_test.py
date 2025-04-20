import sys
from database import create_user, authenticate_user

def test_user_creation():
    """Test creating a new user in the system"""
    print("Testing user creation...")
    
    # Test data
    username = "testuser"
    email = "test@example.com"
    password = "password123"
    
    # Create user
    success, message = create_user(username, email, password)
    print(f"User creation result: {success}, Message: {message}")
    
    return success

def test_user_authentication():
    """Test authenticating a user"""
    print("Testing user authentication...")
    
    # Test data
    email = "test@example.com"
    password = "password123"
    
    # Authenticate user
    success, user = authenticate_user(email, password)
    
    if success:
        print(f"Authentication successful for user: {user['username']}")
        print(f"Last login: {user['last_login']}")
    else:
        print(f"Authentication failed: {user}")
    
    return success

def test_wrong_password():
    """Test authentication with wrong password"""
    print("Testing wrong password...")
    
    # Test data
    email = "test@example.com"
    wrong_password = "wrongpassword"
    
    # Authenticate user
    success, message = authenticate_user(email, wrong_password)
    print(f"Wrong password test result: {success}, Message: {message}")
    
    return not success  # Should return False for wrong password

def main():
    """Main function to run all tests"""
    print("Starting login tests...")
    
    # Run tests
    create_result = test_user_creation()
    auth_result = test_user_authentication()
    wrong_pass_result = test_wrong_password()
    
    # Print summary
    print("\nTest Summary:")
    print(f"User Creation: {'✓' if create_result else '✗'}")
    print(f"User Authentication: {'✓' if auth_result else '✗'}")
    print(f"Wrong Password Test: {'✓' if wrong_pass_result else '✗'}")
    
    all_passed = create_result and auth_result and wrong_pass_result
    print(f"\nOverall result: {'All tests passed!' if all_passed else 'Some tests failed.'}")
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main()) 