from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PersonViewSet, RelationshipViewSet, ParentChildLinkViewSet, GenealogyViewSet, StoryViewSet, MediaViewSet, UserViewSet

router = DefaultRouter()
router.register(r'genealogy/people', PersonViewSet, basename='people')
router.register(r'genealogy/relationships', RelationshipViewSet, basename='relationships')
router.register(r'genealogy/parent_links', ParentChildLinkViewSet, basename='parent_links')
router.register(r'stories', StoryViewSet, basename='stories')
router.register(r'media', MediaViewSet, basename='media')
router.register(r'auth/users/me', UserViewSet, basename='user-me')
# Keep the old path for compatibility
router.register(r'genealogy', GenealogyViewSet, basename='genealogy')

urlpatterns = [
    path('', include(router.urls)),
]
