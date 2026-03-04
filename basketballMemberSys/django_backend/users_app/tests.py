from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import StudentClass, AcademicYear, Child
import datetime

User = get_user_model()

class AcademicYearTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_superuser(username='admin', password='password', email='admin@example.com')
        self.normal_user = User.objects.create_user(username='user', password='password', email='user@example.com')
        self.year_data = {
            'name': '113',
            'start_date': '2024-08-01',
            'end_date': '2025-07-31',
            'is_active': True
        }

    def test_create_academic_year_admin(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post('/api/users/academic-years/', self.year_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(AcademicYear.objects.count(), 1)
        self.assertEqual(AcademicYear.objects.get().name, '113')

    def test_create_academic_year_non_admin(self):
        self.client.force_authenticate(user=self.normal_user)
        response = self.client.post('/api/users/academic-years/', self.year_data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_duplicate_academic_year(self):
        self.client.force_authenticate(user=self.admin_user)
        self.client.post('/api/users/academic-years/', self.year_data)
        response = self.client.post('/api/users/academic-years/', self.year_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_active_years(self):
        self.client.force_authenticate(user=self.admin_user)
        AcademicYear.objects.create(name='112', start_date='2023-08-01', end_date='2024-07-31', is_active=False)
        AcademicYear.objects.create(name='113', start_date='2024-08-01', end_date='2025-07-31', is_active=True)
        
        response = self.client.get('/api/users/academic-years/active/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], '113')


class StudentClassTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_superuser(username='admin', password='password', email='admin@example.com')
        self.normal_user = User.objects.create_user(username='user', password='password', email='user@example.com')
        
        # Create Academic Years
        self.year_112 = AcademicYear.objects.create(name='112', start_date='2023-08-01', end_date='2024-07-31', is_active=True)
        self.year_113 = AcademicYear.objects.create(name='113', start_date='2024-08-01', end_date='2025-07-31', is_active=True)
        
        self.class_data = {'academic_year': self.year_112.id, 'name': 'Class A'}

    def test_create_class_admin(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post('/api/users/classes/', self.class_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(StudentClass.objects.count(), 1)
        self.assertEqual(StudentClass.objects.get().name, 'Class A')
        self.assertEqual(StudentClass.objects.get().academic_year, self.year_112)

    def test_create_class_non_admin(self):
        self.client.force_authenticate(user=self.normal_user)
        response = self.client.post('/api/users/classes/', self.class_data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_class_duplicate_name_same_year(self):
        self.client.force_authenticate(user=self.admin_user)
        self.client.post('/api/users/classes/', self.class_data)
        response = self.client.post('/api/users/classes/', self.class_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_class_same_name_diff_year(self):
        self.client.force_authenticate(user=self.admin_user)
        self.client.post('/api/users/classes/', self.class_data)
        
        data_113 = {'academic_year': self.year_113.id, 'name': 'Class A'}
        response = self.client.post('/api/users/classes/', data_113)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(StudentClass.objects.count(), 2)

    def test_create_class_invalid_year(self):
        self.client.force_authenticate(user=self.admin_user)
        invalid_data = {'academic_year': 999, 'name': 'Class A'}
        response = self.client.post('/api/users/classes/', invalid_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_class(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post('/api/users/classes/', self.class_data)
        class_id = response.data['id']
        
        updated_data = {'academic_year': self.year_113.id, 'name': 'Class B'}
        response = self.client.put(f'/api/users/classes/{class_id}/', updated_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(StudentClass.objects.get(id=class_id).name, 'Class B')
        self.assertEqual(StudentClass.objects.get(id=class_id).academic_year, self.year_113)


class ChildTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.parent_user = User.objects.create_user(username='parent', password='password', email='parent@example.com')
        self.client.force_authenticate(user=self.parent_user)
        
        # Create Academic Year and Class
        self.year = AcademicYear.objects.create(name='113', start_date='2024-08-01', end_date='2025-07-31', is_active=True)
        self.student_class = StudentClass.objects.create(academic_year=self.year, name='Class A')
        
        self.child_data = {
            'name': 'Child A',
            'date_of_birth': '2015-01-01',
            'student_class': self.student_class.id
        }

    def test_create_child_with_class(self):
        response = self.client.post('/api/users/children/', self.child_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Child.objects.count(), 1)
        self.assertEqual(Child.objects.get().student_class, self.student_class)

    def test_create_child_without_class(self):
        data = self.child_data.copy()
        data.pop('student_class') # Remove student_class key entirely to test null behavior
        response = self.client.post('/api/users/children/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Child.objects.count(), 1)
        self.assertIsNone(Child.objects.get().student_class)

    def test_update_child_class(self):
        child = Child.objects.create(name='Child B', parent=self.parent_user)
        updated_data = {
            'name': 'Child B',
            'student_class': self.student_class.id
        }
        response = self.client.put(f'/api/users/children/{child.id}/', updated_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        child.refresh_from_db()
        self.assertEqual(child.student_class, self.student_class)
