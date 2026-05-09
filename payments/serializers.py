from rest_framework import serializers
from .models import Payment

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'

class PaymentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            'id',
            'payment_method',
            'status',
            'transaction_id',
            'selcom_reference',
            'error_message',
            'amount',
            'order',
            'customer',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'status',
            'transaction_id',
            'selcom_reference',
            'error_message',
            'amount',
            'order',
            'customer',
            'created_at',
            'updated_at',
        ]

class EarningsSummarySerializer(serializers.Serializer):
    total_earned_today = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_earned_this_week = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_earned_this_month = serializers.DecimalField(max_digits=12, decimal_places=2)
    available_balance = serializers.DecimalField(max_digits=12, decimal_places=2)
    pending_earnings = serializers.DecimalField(max_digits=12, decimal_places=2)
    in_transit_count = serializers.IntegerField()
    order_count = serializers.IntegerField()
    recent_payouts = PaymentSerializer(many=True, read_only=True)
