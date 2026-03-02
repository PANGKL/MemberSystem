# backend/users_app/models.py
from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    # 繼承 AbstractUser 已經包含了 username, email, password, first_name, last_name 等
    # 我們可以根據需求調整或新增欄位
    name = models.CharField(max_length=255, blank=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)

    ROLE_CHOICES = [
        ('PARENT', 'Parent'),
        ('COACH', 'Coach'),
        ('ADMIN', 'Admin'),
    ]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='PARENT')

    points = models.IntegerField(default=0)

    LEVEL_CHOICES = [
        ('NOVICE', 'Novice'),
        ('EXPERT', 'Expert'),
    ]
    level = models.CharField(max_length=10, choices=LEVEL_CHOICES, default='NOVICE')

    # AbstractUser 已經有 date_joined 和 last_login，這裡不需要 createdAt 和 updatedAt
    # 但如果你想保留，可以這樣定義：
    # created_at = models.DateTimeField(auto_now_add=True)
    # updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return self.username

class Child(models.Model):
    name = models.CharField(max_length=255)
    date_of_birth = models.DateField(blank=True, null=True) # 新增日期欄位
    age_group = models.CharField(max_length=50) # e.g., U10, U12, U14

    SKILL_LEVEL_CHOICES = [
        ('BEGINNER', 'Beginner'),
        ('INTERMEDIATE', 'Intermediate'),
        ('ADVANCED', 'Advanced'),
    ]
    skill_level = models.CharField(max_length=20, choices=SKILL_LEVEL_CHOICES, default='BEGINNER')

    parent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='children')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Child'
        verbose_name_plural = 'Children'

    def __str__(self):
        return f"{self.name} ({self.parent.username})"
