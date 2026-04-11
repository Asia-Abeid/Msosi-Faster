import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'msosi_backend.settings')
django.setup()

from django.contrib.auth import authenticate
from users.models import User

# Delete test user if exists
User.objects.filter(username='test_debug').delete()

# Test create_user
user = User.objects.create_user(
    username='test_debug',
    email='test@example.com',
    password='password123',
    phone_number='255711223344'
)

print(f"User created: {user}, active: {user.is_active}, password hash: {user.password}")

auth_user = authenticate(username='test_debug', password='password123')
if auth_user:
    print("SUCCESS: authentication works!")
else:
    print("FAIL: authentication failed. Why?")
