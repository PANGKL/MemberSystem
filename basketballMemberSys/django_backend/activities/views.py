# activities/views.py
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.utils import timezone

from .models import Activity, Registration, Reward, PointTransaction
from .serializers import (
    ActivitySerializer, RegistrationSerializer, RewardSerializer, PointTransactionSerializer,
    RegistrationCreateSerializer
)
from users_app.models import User, Child # 導入 User 和 Child 模型

class ActivityViewSet(viewsets.ModelViewSet):
    queryset = Activity.objects.all().order_by('date_time')
    serializer_class = ActivitySerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [IsAdminUser] # 只有管理員可以創建、更新、刪除活動
        else:
            self.permission_classes = [IsAuthenticated] # 其他操作（如列表、詳情）需要登入
        return super().get_permissions()

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def register(self, request, pk=None):
        activity = self.get_object()
        user = request.user
        child_id = request.data.get('child_id')

        if not child_id:
            return Response({'detail': '請提供學員 ID (Child ID is required)'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            child = Child.objects.get(id=child_id, parent=user)
        except Child.DoesNotExist:
            return Response({'detail': '學員不存在或不屬於當前用戶 (Child not found or does not belong to current user)'}, status=status.HTTP_404_NOT_FOUND)

        if activity.current_participants >= activity.max_participants:
            return Response({'detail': '活動已滿額 (Activity is full)'}, status=status.HTTP_400_BAD_REQUEST)

        if Registration.objects.filter(child=child, activity=activity).exists():
            return Response({'detail': '該學員已報名此活動 (Child already registered for this activity)'}, status=status.HTTP_400_BAD_REQUEST)

        # 創建報名記錄
        registration = Registration.objects.create(
            user=user,
            child=child,
            activity=activity,
            medical_statement=request.data.get('medical_statement'),
            emergency_contact=request.data.get('emergency_contact'),
            emergency_phone=request.data.get('emergency_phone'),
        )

        # 更新活動人數
        activity.current_participants += 1
        activity.save()

        serializer = RegistrationSerializer(registration)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class RegistrationViewSet(viewsets.ModelViewSet):
    queryset = Registration.objects.all()
    serializer_class = RegistrationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Registration.objects.all()
        return Registration.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # 這裡的創建邏輯應該在 ActivityViewSet 的 register action 中處理
        # 或者需要更複雜的邏輯來確保活動人數更新等
        serializer.save(user=self.request.user)

class RewardViewSet(viewsets.ModelViewSet):
    queryset = Reward.objects.all()
    serializer_class = RewardSerializer
    permission_classes = [IsAdminUser] # 只有管理員可以操作獎勵

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            self.permission_classes = [IsAuthenticated] # 登入用戶可以查看獎勵列表和詳情
        else:
            self.permission_classes = [IsAdminUser]
        return super().get_permissions()

class PointTransactionViewSet(viewsets.ModelViewSet):
    queryset = PointTransaction.objects.all().order_by('-created_at')
    serializer_class = PointTransactionSerializer
    permission_classes = [IsAdminUser] # 只有管理員可以查看所有積分交易

    def get_queryset(self):
        if self.request.user.is_staff:
            return PointTransaction.objects.all()
        return PointTransaction.objects.filter(user=self.request.user) # 普通用戶只能查看自己的交易

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            self.permission_classes = [IsAuthenticated] # 登入用戶可以查看自己的交易
        else:
            self.permission_classes = [IsAdminUser]
        return super().get_permissions()
