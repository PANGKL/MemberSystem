# users_app/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, ChildViewSet

# Router for ChildViewSet
child_router = DefaultRouter()
child_router.register(r'', ChildViewSet, basename='child') # /api/users/children/

# Router for UserViewSet (for admin operations on all users)
user_admin_router = DefaultRouter()
user_admin_router.register(r'', UserViewSet, basename='user-admin') # /api/users/ (for admin list/create/retrieve/update/delete)

urlpatterns = [
    # User-specific actions (profile, register, export, purge)
    path('profile/', UserViewSet.as_view({'get': 'profile', 'put': 'profile', 'patch': 'profile'}), name='user-profile'),
    path('register/', UserViewSet.as_view({'post': 'register'}), name='user-register'),
    path('export-data/', UserViewSet.as_view({'get': 'export_data'}), name='user-export-data'),
    path('purge-account/', UserViewSet.as_view({'delete': 'purge_account'}), name='user-purge-account'),

    # Child-related actions
    path('children/', include(child_router.urls)),

    # Admin actions for users (list, create, retrieve, update, delete other users)
    path('', include(user_admin_router.urls)),
]
