import requests
import string
import random

def main():
    # Generate a random username to avoid uniqueness conflicts
    rand_str = ''.join(random.choices(string.ascii_lowercase, k=6))
    username = f'testuser_{rand_str}'
    password = 'Password123!'

    register_data = {
        'username': username,
        'email': f'{username}@example.com',
        'password': password,
        'phone_number': f'255711{random.randint(1000,9999)}',
        'is_customer': True,
        'is_restaurant_owner': False
    }

    print("Registering:", register_data)
    resp = requests.post('http://127.0.0.1:8000/api/users/register/', json=register_data)
    print("Register Status:", resp.status_code)
    print("Register Response:", resp.text)

    login_data = {
        'username': username,
        'password': password
    }

    print("\nLogging in:", login_data)
    resp = requests.post('http://127.0.0.1:8000/api/users/login/', json=login_data)
    print("Login Status:", resp.status_code)
    print("Login Response:", resp.text)

if __name__ == '__main__':
    main()
