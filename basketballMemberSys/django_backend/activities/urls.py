# activities/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ActivityViewSet, RegistrationViewSet, RewardViewSet, PointTransactionViewSet

router = DefaultRouter()
router.register(r'registrations', RegistrationViewSet, basename='registration') # 報名列表和 CRUD
router.register(r'rewards', RewardViewSet, basename='reward') # 獎勵列表和 CRUD
router.register(r'point-transactions', PointTransactionViewSet, basename='point-transaction') # 積分交易列表和 CRUD
router.register(r'', ActivityViewSet, basename='activity') # 活動列表和 CRUD放在最後，避免攔截其他路徑

urlpatterns = [
    path('', include(router.urls)),
    # 活動報名：/api/activities/{activity_id}/register/
]
