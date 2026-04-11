from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User
from .serializers import UserSerializer, RegisterSerializer
from django.contrib.auth import authenticate
from django.core.cache import cache
import random
import logging

logger = logging.getLogger(__name__)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer


class LoginView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request, *args, **kwargs):
        username = request.data.get("username", "").strip()
        password = request.data.get("password", "")
        user = authenticate(username=username, password=password)
        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data
            })
        return Response({"detail": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)


class ProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class ForgotPasswordView(APIView):
    """
    POST /api/users/forgot-password/
    Body: { "email": "user@example.com" }
    Generates a 6-digit OTP, stores in cache for 10 minutes, and logs it (email sending stub).
    """
    permission_classes = (AllowAny,)

    def post(self, request, *args, **kwargs):
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({'detail': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            # Return success even if user doesn't exist (security best practice)
            return Response({'detail': 'If that email is registered, a reset code has been sent.'})

        otp = str(random.randint(100000, 999999))
        cache_key = f'pwd_reset_otp_{email}'
        cache.set(cache_key, otp, timeout=600)  # 10 minutes

        # TODO: Send email — for now, log to console for development
        logger.info(f'[PASSWORD RESET OTP] Email: {email} | OTP: {otp}')
        print(f'\n🔑 PASSWORD RESET OTP for {email}: {otp}\n')

        return Response({'detail': 'If that email is registered, a reset code has been sent.'})


class ResetPasswordView(APIView):
    """
    POST /api/users/reset-password/
    Body: { "email": "user@example.com", "otp": "123456", "new_password": "newpass123" }
    """
    permission_classes = (AllowAny,)

    def post(self, request, *args, **kwargs):
        email = request.data.get('email', '').strip().lower()
        otp = request.data.get('otp', '').strip()
        new_password = request.data.get('new_password', '')

        if not all([email, otp, new_password]):
            return Response({'detail': 'Email, OTP, and new password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 8:
            return Response({'detail': 'Password must be at least 8 characters.'}, status=status.HTTP_400_BAD_REQUEST)

        cache_key = f'pwd_reset_otp_{email}'
        stored_otp = cache.get(cache_key)

        if not stored_otp or stored_otp != otp:
            return Response({'detail': 'Invalid or expired OTP.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response({'detail': 'Invalid or expired OTP.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        cache.delete(cache_key)

        return Response({'detail': 'Password reset successfully. Please log in with your new password.'})
