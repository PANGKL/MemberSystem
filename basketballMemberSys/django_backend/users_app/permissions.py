# users_app/permissions.py
from rest_framework import permissions

class IsAdminOrOwner(permissions.BasePermission):
    """
    允許管理員或物件的擁有者訪問。
    """
    def has_object_permission(self, request, view, obj):
        # 讀取權限允許任何請求，所以我們總是允許 GET, HEAD 或 OPTIONS 請求。
        if request.method in permissions.SAFE_METHODS:
            return True

        # 寫入權限只允許物件的擁有者或管理員。
        return obj.parent == request.user or request.user.is_staff
