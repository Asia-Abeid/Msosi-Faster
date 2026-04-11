from rest_framework import permissions

class IsRestaurantOwner(permissions.BasePermission):
    """
    Allows access only to restaurant owners.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_restaurant_owner)
