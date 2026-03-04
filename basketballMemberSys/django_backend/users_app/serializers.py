# users_app/serializers.py
from rest_framework import serializers
from .models import User, Child, StudentClass, AcademicYear

class AcademicYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicYear
        fields = '__all__'

class StudentClassSerializer(serializers.ModelSerializer):
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)

    class Meta:
        model = StudentClass
        fields = '__all__'

class ChildSerializer(serializers.ModelSerializer):
    active_courses = serializers.SerializerMethodField()
    student_class_name = serializers.CharField(source='student_class.name', read_only=True)
    academic_year_name = serializers.CharField(source='student_class.academic_year.name', read_only=True)
    parent_name = serializers.CharField(source='parent.name', read_only=True)

    class Meta:
        model = Child
        fields = '__all__'
        extra_kwargs = {
            'parent': {'read_only': True},
        }

    def get_active_courses(self, obj):
        # Avoid circular import
        from activities.models import Registration
        registrations = Registration.objects.filter(child=obj, status='CONFIRMED')
        return [r.activity.title for r in registrations]

class UserSerializer(serializers.ModelSerializer):
    children = ChildSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'name', 'phone_number', 'role', 'points', 'level', 'is_staff', 'is_superuser', 'children', 'date_joined']
        read_only_fields = ['role', 'points', 'level', 'is_staff', 'is_superuser', 'date_joined']

class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'name', 'phone_number']
        extra_kwargs = {
            'email': {'required': False, 'allow_blank': True},
            'name': {'required': False, 'allow_blank': True},
            'phone_number': {'required': False, 'allow_blank': True},
        }

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email'),
            password=validated_data['password'],
            name=validated_data.get('name', ''),
            phone_number=validated_data.get('phone_number', ''),
        )
        return user

class AdminUserSerializer(serializers.ModelSerializer):
    children = ChildSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'name', 'phone_number', 'role', 'points', 'level', 'children', 'date_joined']
