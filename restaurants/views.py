from rest_framework import generics, status, permissions
from rest_framework.response import Response
from .models import Restaurant, MenuItem
from .serializers import RestaurantSerializer, MenuItemSerializer
from msosi_backend.permissions import IsRestaurantOwner

class FoodList(generics.ListAPIView):
    """
    Customer feed: list all available food items.
    """
    queryset = MenuItem.objects.filter(is_available=True)
    serializer_class = MenuItemSerializer
    permission_classes = [permissions.AllowAny]

class MyMenu(generics.ListAPIView):
    """
    Owner dashboard: list all items belonging to this owner's restaurants.
    """
    serializer_class = MenuItemSerializer
    permission_classes = [IsRestaurantOwner]

    def get_queryset(self):
        return MenuItem.objects.filter(restaurant__owner=self.request.user)

class MenuItemCreateUpdate(generics.RetrieveUpdateDestroyAPIView, generics.CreateAPIView):
    """
    Owner only: Create, update or delete a menu item.
    """
    serializer_class = MenuItemSerializer
    permission_classes = [IsRestaurantOwner]

    def get_queryset(self):
        return MenuItem.objects.filter(restaurant__owner=self.request.user)

class FoodDetail(generics.RetrieveAPIView):
    """
    Customer view: Detail of any available menu item.
    """
    queryset = MenuItem.objects.filter(is_available=True)
    serializer_class = MenuItemSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        # We assume the user has at least one restaurant. 
        # If multiple, let them choose. In a simple case, pick the first.
        # Ideally, we'd pass restaurant ID in the request.
        restaurant_id = self.request.data.get('restaurant')
        if restaurant_id:
            restaurant = Restaurant.objects.filter(id=restaurant_id, owner=self.request.user).first()
        else:
            restaurant = Restaurant.objects.filter(owner=self.request.user).first()
            
        if not restaurant:
            restaurant = Restaurant.objects.create(
                owner=self.request.user, 
                name=f"{self.request.user.username}'s Kitchen", 
                address="N/A", 
                phone_number=self.request.user.phone_number or "000000000"
            )
        serializer.save(restaurant=restaurant)

from rest_framework import generics, status, permissions, filters

class RestaurantList(generics.ListCreateAPIView):
    queryset = Restaurant.objects.filter(is_active=True)
    serializer_class = RestaurantSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'description']

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class RestaurantDetail(generics.RetrieveAPIView):
    queryset = Restaurant.objects.filter(is_active=True)
    serializer_class = RestaurantSerializer
    permission_classes = [permissions.AllowAny]

class RestaurantMenu(generics.ListAPIView):
    serializer_class = MenuItemSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        restaurant_id = self.kwargs.get('pk')
        return MenuItem.objects.filter(restaurant_id=restaurant_id, is_available=True)
