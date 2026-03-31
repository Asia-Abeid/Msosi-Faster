from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

class UserAdmin(BaseUserAdmin):
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Custom Fields', {'fields': ('phone_number', 'is_customer', 'is_restaurant_owner', 'address', 'profile_picture')}),
    )
    list_display = ['username', 'email', 'phone_number', 'is_customer', 'is_restaurant_owner']

admin.site.register(User, UserAdmin)
