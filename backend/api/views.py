from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db.models import Q, Prefetch
from .models import Person, Relationship, ParentChildLink, Story, Media, Feedback
from .serializers import (PersonSerializer, GraphNodeSerializer, GraphEdgeSerializer,
                         RelationshipSerializer, ParentChildLinkSerializer,
                         StorySerializer, MediaSerializer, FeedbackSerializer)

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class UserViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

    def get_queryset(self):
        return User.objects.filter(pk=self.request.user.pk)

class PersonViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Person.objects.all()
    serializer_class = PersonSerializer

    def get_queryset(self):
        """Optimized queryset with prefetching for related data"""
        return Person.objects.prefetch_related(
            'relationships_a',
            'relationships_b',
            'parent_links',
            'single_children',
            'stories',
            'media'
        )

    @action(detail=False, methods=['get'])
    def visual_tree(self, request):
        focus_id = request.query_params.get('focus_id')

        if focus_id:
            try:
                center_person = Person.objects.get(id=focus_id)
                people_ids = {center_person.id}

                # Get Spouses - optimized with select_related
                relationships = Relationship.objects.select_related(
                    'person_a', 'person_b'
                ).filter(
                    Q(person_a=center_person) | Q(person_b=center_person)
                )
                for rel in relationships:
                    people_ids.add(rel.person_a_id)
                    people_ids.add(rel.person_b_id)

                # Get Children - optimized with select_related
                children_links = ParentChildLink.objects.select_related(
                    'child', 'single_parent', 'relationship', 
                    'relationship__person_a', 'relationship__person_b'
                ).filter(
                    Q(single_parent=center_person) |
                    Q(relationship__person_a=center_person) |
                    Q(relationship__person_b=center_person)
                )
                for link in children_links:
                    people_ids.add(link.child_id)

                # Get Parents - optimized with select_related
                parent_links = ParentChildLink.objects.select_related(
                    'child', 'single_parent', 'relationship',
                    'relationship__person_a', 'relationship__person_b'
                ).filter(child=center_person)
                
                for link in parent_links:
                    if link.single_parent_id:
                        people_ids.add(link.single_parent_id)
                    if link.relationship:
                        people_ids.add(link.relationship.person_a_id)
                        people_ids.add(link.relationship.person_b_id)

                people = Person.objects.filter(id__in=people_ids)
                # Fetch ALL relationships between the visible people, so parents appear married
                spousal_relationships = Relationship.objects.select_related(
                    'person_a', 'person_b'
                ).filter(
                    person_a__in=people,
                    person_b__in=people
                )
                parent_child_links = children_links | parent_links

            except Person.DoesNotExist:
                return Response({"error": "Person not found"}, status=status.HTTP_404_NOT_FOUND)
        else:
            # Full tree - limit for performance
            people = Person.objects.all()[:500]  # Limit to prevent memory issues
            spousal_relationships = Relationship.objects.select_related(
                'person_a', 'person_b'
            ).all()
            parent_child_links = ParentChildLink.objects.select_related(
                'child', 'single_parent', 'relationship',
                'relationship__person_a', 'relationship__person_b'
            ).all()

        nodes_data = GraphNodeSerializer(people, many=True, context={'request': request}).data
        spouse_edges = GraphEdgeSerializer(spousal_relationships, many=True, context={'request': request}).data

        if focus_id:
            # For focus tree
            child_edges = []
            for link in children_links:
                child_edges.append({
                    "id": f"child-link-{link.id}",
                    "source": center_person.id,
                    "target": link.child.id,
                    "animated": False,
                    "style": {"stroke": "#3b82f6", "strokeWidth": 2},
                    "label": "",
                    "sourceHandle": "bottom",
                    "targetHandle": "top",
                    "relationship_type": "BIO"
                })
            for link in parent_links:
                if link.single_parent:
                    source = link.single_parent.id
                elif link.relationship:
                    source = link.relationship.person_a.id if link.relationship.person_a.id != center_person.id else link.relationship.person_b.id
                else:
                    continue  # Invalid link
                child_edges.append({
                    "id": f"parent-link-{link.id}",
                    "source": source,
                    "target": center_person.id,
                    "animated": False,
                    "style": {"stroke": "#3b82f6", "strokeWidth": 2},
                    "label": "",
                    "sourceHandle": "bottom",
                    "targetHandle": "top",
                    "relationship_type": "BIO"
                })
        else:
            child_edges = [
                {
                    "id": f"link-{link.id}",
                    "source": link.single_parent.id if link.single_parent else link.relationship.person_a.id,
                    "target": link.child.id,
                    "animated": False,
                    "style": {"stroke": "#3b82f6", "strokeWidth": 2},
                    "label": "",
                    "sourceHandle": "bottom",
                    "targetHandle": "top",
                    "relationship_type": "BIO"
                }
                for link in parent_child_links if link.single_parent or (link.relationship and link.relationship.person_a)
            ]

        return Response({
            "nodes": nodes_data,
            "edges": spouse_edges + child_edges
        })

class RelationshipViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = RelationshipSerializer

    def get_queryset(self):
        """Optimized queryset with select_related"""
        return Relationship.objects.select_related('person_a', 'person_b')


class ParentChildLinkViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ParentChildLinkSerializer

    def get_queryset(self):
        """Optimized queryset with select_related and filtering"""
        queryset = ParentChildLink.objects.select_related(
            'child', 'single_parent', 'relationship',
            'relationship__person_a', 'relationship__person_b'
        )
        child_id = self.request.query_params.get('child', None)
        if child_id is not None:
            queryset = queryset.filter(child_id=child_id)
        return queryset


class StoryViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = StorySerializer
    
    def get_queryset(self):
        """Optimized queryset with select_related and prefetch_related"""
        return Story.objects.select_related('author').prefetch_related(
            'tagged_people', 'media_items'
        ).order_by('-created_at')
    
    def perform_create(self, serializer):
        # Automatically set the author to the current user
        serializer.save(author=self.request.user)
    
    @action(detail=False, methods=['get'])
    def by_person(self, request):
        """Get all stories tagged with a specific person"""
        person_id = request.query_params.get('person_id')
        if person_id:
            stories = self.get_queryset().filter(tagged_people__id=person_id)
            serializer = self.get_serializer(stories, many=True)
            return Response(serializer.data)
        return Response({"error": "person_id required"}, status=status.HTTP_400_BAD_REQUEST)


class MediaViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = MediaSerializer
    
    def get_queryset(self):
        """Optimized queryset with select_related and prefetch_related"""
        return Media.objects.select_related(
            'uploaded_by', 'story'
        ).prefetch_related('tagged_people').order_by('-created_at')
    
    def perform_create(self, serializer):
        # Automatically set the uploader to the current user
        serializer.save(uploaded_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def by_person(self, request):
        """Get all media tagged with a specific person"""
        person_id = request.query_params.get('person_id')
        if person_id:
            media = self.get_queryset().filter(tagged_people__id=person_id)
            serializer = self.get_serializer(media, many=True)
            return Response(serializer.data)
        return Response({"error": "person_id required"}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def by_type(self, request):
        """Filter media by type (photos, videos, etc.)"""
        media_type = request.query_params.get('type')
        if media_type:
            media = self.get_queryset().filter(media_type=media_type)
            serializer = self.get_serializer(media, many=True)
            return Response(serializer.data)
        return Response({"error": "type required"}, status=status.HTTP_400_BAD_REQUEST)

class FeedbackViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = FeedbackSerializer
    
    def get_queryset(self):
        return Feedback.objects.select_related('user').order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# Keep GenealogyViewSet as alias for backward compatibility
class GenealogyViewSet(PersonViewSet):
    pass