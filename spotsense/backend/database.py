from pymongo import MongoClient
import hashlib
import datetime
import uuid

# Use MongoDB Atlas with retryWrites disabled
DB = "mongodb+srv://sawantsamikshac:samics1234@cluster.swxql.mongodb.net/?retryWrites=false"

try:
    cluster = MongoClient(DB)
    print("Connected to MongoDB Atlas")
except Exception as e:
    print("Warning: Could not connect to MongoDB. Using mock data.")
    # Create mock collections for testing
    class MockCollection:
        def find_one(self, query): return None
        def insert_one(self, doc): pass
        def update_one(self, query, update): pass
    
    class MockDB:
        def __init__(self):
            self.CarInfo = MockCollection()
            self.CarInfo2 = MockCollection()
            self.CarInfo3 = MockCollection()
            self.UserAuth = MockCollection()
    
    cluster = type('MockCluster', (), {
        'ParkApp': MockDB(),
        'AdminDB': MockDB()
    })

ParkApp = cluster.ParkApp
AdminDB = cluster.AdminDB
CarInfo = ParkApp.CarInfo
CarInfo2 = ParkApp.CarInfo2
CarInfo3 = ParkApp.CarInfo3
UserAuth = AdminDB.UserAuth

# User Authentication Functions
def hash_password(password):
    """Hash a password for storing."""
    salt = uuid.uuid4().hex
    return hashlib.sha256(salt.encode() + password.encode()).hexdigest() + ':' + salt

def verify_password(hashed_password, user_password):
    """Verify a stored password against one provided by user"""
    password, salt = hashed_password.split(':')
    return password == hashlib.sha256(salt.encode() + user_password.encode()).hexdigest()

def create_user(username, email, password):
    """Create a new user in the UserAuth collection"""
    # Check if user already exists
    if UserAuth.find_one({"email": email}):
        return False, "Email already registered"
    
    # Create user document
    user = {
        "username": username,
        "email": email,
        "password": hash_password(password),
        "created_at": datetime.datetime.now(),
        "last_login": None,
        "is_active": True
    }
    
    # Insert user into database
    UserAuth.insert_one(user)
    return True, "User created successfully"

def authenticate_user(email, password):
    """Authenticate a user by email and password"""
    user = UserAuth.find_one({"email": email})
    
    if not user:
        return False, "User not found"
    
    if not verify_password(user["password"], password):
        return False, "Incorrect password"
    
    # Update last login time
    UserAuth.update_one(
        {"email": email},
        {"$set": {"last_login": datetime.datetime.now()}}
    )
    
    return True, user

def get_user_by_id(user_id):
    """Get user by ID"""
    return UserAuth.find_one({"_id": user_id})

def update_user_info(user_id, update_data):
    """Update user information"""
    UserAuth.update_one(
        {"_id": user_id},
        {"$set": update_data}
    )
    return True, "User information updated"

