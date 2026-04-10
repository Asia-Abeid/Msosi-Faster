from django.urls import path
from .views import FoodList, MyMenu, MenuItemCreateUpdate, RestaurantList, RestaurantDetail, RestaurantMenu, FoodDetail

urlpatterns = [
    path('', RestaurantList.as_view(), name='restaurant-list'),
    path('food/', FoodList.as_view(), name='food-list'),
    path('food/mine/', MyMenu.as_view(), name='my-menu'),
    path('food/<int:pk>/', MenuItemCreateUpdate.as_view(), name='food-edit'),
    path('food/create/', MenuItemCreateUpdate.as_view(), name='food-create'),
    path('food-items/<int:pk>/', FoodDetail.as_view(), name='food-detail'),
    path('<int:pk>/', RestaurantDetail.as_view(), name='restaurant-detail'),
    path('<int:pk>/food/', RestaurantMenu.as_view(), name='restaurant-menu'),
]
