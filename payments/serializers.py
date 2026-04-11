from rest_framework import serializers
from .models import Payment

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'

class EarningsSummarySerializer(serializers.Serializer):
    total_earned_today = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_earned_this_week = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_earned_this_month = serializers.DecimalField(max_digits=12, decimal_places=2)
    order_count = serializers.IntegerField()
    recent_payouts = PaymentSerializer(many=True, read_only=True)
