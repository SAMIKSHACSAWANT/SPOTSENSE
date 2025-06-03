import argparse
import getpass
from database import create_user, authenticate_user, get_user_by_id, update_user_info, UserAuth

def register_user():
    """Interactive function to register a new user"""
    print("=== User Registration ===")
    username = input("Enter username: ")
    email = input("Enter email: ")
    password = getpass.getpass("Enter password: ")
    confirm_password = getpass.getpass("Confirm password: ")
    
    if password != confirm_password:
        print("Error: Passwords do not match")
        return False
    
    success, message = create_user(username, email, password)
    print(message)
    return success

def login_user():
    """Interactive function to login a user"""
    print("=== User Login ===")
    email = input("Enter email: ")
    password = getpass.getpass("Enter password: ")
    
    success, result = authenticate_user(email, password)
    if success:
        print(f"Welcome back, {result['username']}!")
        print(f"Last login: {result['last_login']}")
    else:
        print(f"Login failed: {result}")
    
    return success

def list_users():
    """List all users in the database"""
    print("=== User List ===")
    users = UserAuth.find({})
    
    if users.count() == 0:
        print("No users found in the database.")
        return
    
    print(f"{'Username':<20} {'Email':<30} {'Last Login':<20} {'Active'}")
    print("-" * 80)
    
    for user in users:
        username = user.get('username', 'N/A')
        email = user.get('email', 'N/A')
        last_login = user.get('last_login', 'Never')
        is_active = "Yes" if user.get('is_active', False) else "No"
        
        print(f"{username:<20} {email:<30} {str(last_login):<20} {is_active}")

def delete_user():
    """Delete a user by email"""
    print("=== Delete User ===")
    email = input("Enter email of user to delete: ")
    
    # Find user
    user = UserAuth.find_one({"email": email})
    if not user:
        print(f"User with email {email} not found.")
        return False
    
    # Confirm deletion
    confirm = input(f"Are you sure you want to delete user {user['username']}? (y/n): ")
    if confirm.lower() != 'y':
        print("Operation cancelled.")
        return False
    
    # Delete user
    result = UserAuth.delete_one({"email": email})
    if result.deleted_count > 0:
        print(f"User {email} has been deleted.")
        return True
    else:
        print("Error: User could not be deleted.")
        return False

def main():
    """Main function for user management"""
    parser = argparse.ArgumentParser(description='User Management Utility')
    parser.add_argument('action', choices=['register', 'login', 'list', 'delete'],
                      help='Action to perform')
    
    args = parser.parse_args()
    
    if args.action == 'register':
        register_user()
    elif args.action == 'login':
        login_user()
    elif args.action == 'list':
        list_users()
    elif args.action == 'delete':
        delete_user()

if __name__ == "__main__":
    main() 