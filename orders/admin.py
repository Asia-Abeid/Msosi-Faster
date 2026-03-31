from django.contrib import admin
from .models import Order, OrderItem

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 1

class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'customer', 'status', 'total_price', 'created_at']
    inlines = [OrderItemInline]
    search_fields = ['customer__username', 'id']
    list_filter = ['status', 'created_at']
    readonly_fields = ['created_at', 'updated_at']

class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['order', 'menu_item', 'quantity', 'price']
    search_fields = ['order__id', 'menu_item__name']

admin.site.register(Order, OrderAdmin)
admin.site.register(OrderItem, OrderItemAdmin)
