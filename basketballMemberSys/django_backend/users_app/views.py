# users_app/views.py
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework_simplejwt.views import TokenObtainPairView
from django.utils import timezone # 導入 timezone

from .models import User, Child
from .serializers import (
    UserSerializer, ChildSerializer, UserRegisterSerializer, AdminUserSerializer
)
from .permissions import IsAdminOrOwner

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser] # 預設只有管理員可以操作所有用戶

    def get_serializer_class(self):
        if self.action == 'register':
            return UserRegisterSerializer
        elif self.action in ['list', 'create', 'update', 'partial_update', 'retrieve'] and self.request.user.is_staff:
            return AdminUserSerializer
        return UserSerializer

    def get_permissions(self):
        if self.action == 'register':
            self.permission_classes = [AllowAny]
        elif self.action in ['profile', 'export_data', 'purge_account']: # 移除 'children'，因為 ChildViewSet 會處理
            self.permission_classes = [IsAuthenticated]
        elif self.action in ['list', 'create', 'retrieve', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [IsAdminUser] # 管理員可以對所有用戶進行 CRUD
        else:
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def register(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get', 'put', 'patch'], permission_classes=[IsAuthenticated])
    def profile(self, request):
        user = request.user
        if request.method == 'GET':
            serializer = self.get_serializer(user)
            return Response(serializer.data) # 這裡應該返回單個物件
        elif request.method in ['PUT', 'PATCH']:
            serializer = self.get_serializer(user, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def export_data(self, request):
        user = request.user
        serializer = UserSerializer(user) # 這裡可以創建一個專門用於導出的序列化器，包含更多關聯數據
        return Response({
            "title": "GDPR Data Export",
            "timestamp": timezone.now(),
            "data": serializer.data
        })

    @action(detail=False, methods=['delete'], permission_classes=[IsAuthenticated])
    def purge_account(self, request):
        user = request.user
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['put'], permission_classes=[IsAdminUser])
    def reset_password(self, request, pk=None):
        user = self.get_object()
        new_password = request.data.get('newPassword') or request.data.get('password')
        if not new_password:
            return Response({'detail': 'New password is required'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(new_password)
        user.save()
        return Response({'detail': 'Password reset successful'})

class ChildViewSet(viewsets.ModelViewSet):
    queryset = Child.objects.all()
    serializer_class = ChildSerializer
    permission_classes = [IsAuthenticated, IsAdminOrOwner] # 只有登入用戶和管理員可以操作

    def get_queryset(self):
        if self.request.user.is_staff: # 管理員可以看到所有孩子的資料
            return Child.objects.all()
        return self.request.user.children.all() # 普通用戶只能看到自己的孩子

    def perform_create(self, serializer):
        # 管理員可為任意家長建立學員；一般用戶為自己建立
        if self.request.user.is_staff:
            parent_id = self.request.data.get('parent') or self.request.data.get('parent_id')
            if parent_id:
                from django.shortcuts import get_object_or_404
                parent = get_object_or_404(User, pk=parent_id)
                serializer.save(parent=parent)
                return
        serializer.save(parent=self.request.user)
