from django.utils import timezone

from .models import Order


AUTO_DELIVER_AFTER_HOURS = 24


def auto_deliver_stale_orders():
    cutoff = timezone.now() - timezone.timedelta(hours=AUTO_DELIVER_AFTER_HOURS)
    return Order.objects.filter(
        status='on_the_way',
        updated_at__lte=cutoff,
        payment__status='completed',
    ).update(status='delivered', updated_at=timezone.now())
