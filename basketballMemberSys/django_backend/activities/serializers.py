# activities/serializers.py
from rest_framework import serializers
from .models import Activity, Registration, Reward, PointTransaction
from users_app.serializers import UserSerializer, ChildSerializer # 導入 UserSerializer 和 ChildSerializer

class ActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Activity
        fields = '__all__'

class RegistrationSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True) # 顯示使用者詳細資訊
    child = ChildSerializer(read_only=True) # 顯示學員詳細資訊

    class Meta:
        model = Registration
        fields = '__all__'
        read_only_fields = ['user', 'child', 'activity', 'status', 'attendance'] # 這些欄位通常由後端控制

class RegistrationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Registration
        fields = ['child', 'activity', 'medical_statement', 'emergency_contact', 'emergency_phone']

class RewardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reward
        fields = '__all__'

class PointTransactionSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True) # 顯示使用者詳細資訊

    class Meta:
        model = PointTransaction
        fields = '__all__'
        read_only_fields = ['user']
