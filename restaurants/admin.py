from django.contrib import admin
from .models import Restaurant, MenuItem

class MenuItemInline(admin.TabularInline):
    model = MenuItem
    extra = 1

class RestaurantAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'phone_number', 'is_active', 'created_at']
    inlines = [MenuItemInline]
    search_fields = ['name', 'owner__username']
    list_filter = ['is_active', 'created_at']

class MenuItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'restaurant', 'price', 'is_available', 'created_at']
    search_fields = ['name', 'restaurant__name']
    list_filter = ['is_available', 'created_at']

admin.site.register(Restaurant, RestaurantAdmin)
admin.site.register(MenuItem, MenuItemAdmin)
