# activities/serializers.py
from rest_framework import serializers
from .models import Activity, Registration, Reward, PointTransaction
from users_app.serializers import UserSerializer, ChildSerializer # 導入 UserSerializer 和 ChildSerializer

class RegistrationSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    child = ChildSerializer(read_only=True)

    class Meta:
        model = Registration
        fields = '__all__'
        read_only_fields = ['user', 'status', 'attendance']

class ActivitySerializer(serializers.ModelSerializer):
    currentParticipants = serializers.IntegerField(source='current_participants', read_only=True)
    maxParticipants = serializers.IntegerField(source='max_participants')
    registrations = RegistrationSerializer(many=True, read_only=True)

    class Meta:
        model = Activity
        fields = [
            'id', 'title', 'type', 'description', 'location', 'price', 
            'date', 'time', 'date_time', 'maxParticipants', 'currentParticipants',
            'created_at', 'updated_at', 'registrations'
        ]
        read_only_fields = ['date_time', 'created_at', 'updated_at']

    def to_internal_value(self, data):
        # 處理前端傳來的駝峰式欄位，但不刪除原始數據
        if 'maxParticipants' in data:
            data['max_participants'] = data['maxParticipants']
        return super().to_internal_value(data)

class RegistrationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Registration
        fields = ['child', 'activity', 'medical_statement', 'emergency_contact', 'emergency_phone']

class RegistrationUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Registration
        fields = ['payment_receipt', 'payment_reference', 'status', 'attendance']

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
