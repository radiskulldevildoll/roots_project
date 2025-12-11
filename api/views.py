from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Person, Relationship, ParentChildLink
from .serializers import PersonSerializer, GraphNodeSerializer, GraphEdgeSerializer

class GenealogyViewSet(viewsets.ModelViewSet):
    """
    The main control center.
    """
    queryset = Person.objects.all()
    serializer_class = PersonSerializer

    @action(detail=False, methods=['get'])
    def visual_tree(self, request):
        """
        Returns the data in a format ready for the 'Infinite Canvas'.
        {
            "nodes": [...],
            "edges": [...]
        }
        """
        people = Person.objects.all()
        spousal_relationships = Relationship.objects.all()
        parent_child_links = ParentChildLink.objects.all()  # Fetch parent-child links

        # We define the 'Nodes' (The People)
        nodes_data = GraphNodeSerializer(people, many=True).data

        # 1. Serialize Spouses
        spouse_edges = GraphEdgeSerializer(spousal_relationships, many=True).data

        # 2. Serialize Children (Map to edge structure)
        child_edges = [
            {
                "id": f"link-{link.id}",
                "source": link.single_parent.id if link.single_parent else link.relationship.person_a.id,  # Handle single parent or relationship
                "target": link.child.id,
                "animated": False,
                "style": {"stroke": "#3b82f6", "strokeWidth": 2},  # Blue for lineage
                "label": ""  # No label for child edges
            }
            for link in parent_child_links
        ]

        return Response({
            "nodes": nodes_data,
            "edges": spouse_edges + child_edges  # Combine spouse and child edges
        })
