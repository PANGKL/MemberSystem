# backend/activities/models.py
from django.db import models
from users_app.models import User, Child # 從 users_app 導入 User 和 Child

class Activity(models.Model):
    title = models.CharField(max_length=255)

    ACTIVITY_TYPE_CHOICES = [
        ('COURSE', 'Course'),
        ('TRAINING', 'Training'),
        ('COMPETITION', 'Competition'),
        ('SPECIAL_EVENT', 'Special Event'),
    ]
    type = models.CharField(max_length=20, choices=ACTIVITY_TYPE_CHOICES)

    description = models.TextField(blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    date = models.DateField(null=True, blank=True)
    time = models.TimeField(null=True, blank=True)
    date_time = models.DateTimeField(null=True, blank=True)
    max_participants = models.IntegerField(null=True, blank=True)
    current_participants = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # 如果有 date 和 time，則自動同步到 date_time
        if self.date and self.time:
            from django.utils import timezone
            import datetime
            combined = datetime.datetime.combine(self.date, self.time)
            # 確保時區正確（如果專案開啟了 USE_TZ）
            self.date_time = timezone.make_aware(combined) if timezone.is_aware(combined) == False else combined
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = 'Activity'
        verbose_name_plural = 'Activities'

    def __str__(self):
        return self.title

class Registration(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='registrations')
    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name='registrations')
    activity = models.ForeignKey(Activity, on_delete=models.CASCADE, related_name='registrations')

    medical_statement = models.TextField(blank=True, null=True)
    emergency_contact = models.CharField(max_length=255, blank=True, null=True)
    emergency_phone = models.CharField(max_length=20, blank=True, null=True)

    # 繳費相關
    payment_receipt = models.ImageField(upload_to='receipts/', blank=True, null=True)
    payment_reference = models.CharField(max_length=100, blank=True, null=True)

    STATUS_CHOICES = [
        ('PENDING_PAYMENT', 'Pending Payment'), # 待繳費
        ('AWAITING_APPROVAL', 'Awaiting Approval'), # 待審核
        ('CONFIRMED', 'Confirmed'), # 已報名/已確認
        ('CANCELLED', 'Cancelled'), # 已取消
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING_PAYMENT')
    attendance = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    # updated_at = models.DateTimeField(auto_now=True) # Prisma schema 中 Registration 沒有 updatedAt

    class Meta:
        verbose_name = 'Registration'
        verbose_name_plural = 'Registrations'
        unique_together = ('child', 'activity') # 確保一個孩子不能重複報名同一個活動

    def __str__(self):
        return f"{self.child.name} - {self.activity.title}"

class Reward(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    points_required = models.IntegerField()
    stock = models.IntegerField(default=0)
    image_url = models.URLField(blank=True, null=True) # 圖片 URL

    created_at = models.DateTimeField(auto_now_add=True)
    # updated_at = models.DateTimeField(auto_now=True) # Prisma schema 中 Reward 沒有 updatedAt

    class Meta:
        verbose_name = 'Reward'
        verbose_name_plural = 'Rewards'

    def __str__(self):
        return self.title

class PointTransaction(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='point_transactions')
    points = models.IntegerField() # Positive for earn, negative for spend

    REASON_CHOICES = [
        ('ATTENDANCE', 'Attendance'),
        ('WIN', 'Win'),
        ('REDEMPTION', 'Redemption'),
        ('ADMIN_ADJUST', 'Admin Adjustment'), # 管理員調整
    ]
    reason = models.CharField(max_length=20, choices=REASON_CHOICES)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Point Transaction'
        verbose_name_plural = 'Point Transactions'

    def __str__(self):
        return f"{self.user.username} - {self.points} points for {self.reason}"
