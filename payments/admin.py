from django.contrib import admin
from .models import Payment

class PaymentAdmin(admin.ModelAdmin):
    list_display = ['id', 'customer', 'amount', 'payment_method', 'status', 'created_at']
    search_fields = ['customer__username', 'transaction_id']
    list_filter = ['status', 'payment_method', 'created_at']
    readonly_fields = ['created_at', 'updated_at']

admin.site.register(Payment, PaymentAdmin)
