from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Person, Relationship
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
        relationships = Relationship.objects.all()

        # We define the 'Nodes' (The People)
        nodes_data = GraphNodeSerializer(people, many=True).data

        # We define the 'Edges' (The Connections)
        # Note: We actually need two types of edges: Spousal and Parental.
        # For simplicity here, we are just returning spousal/partner links.
        # In the full build, we'd add ParentChildLink edges too.
        edges_data = GraphEdgeSerializer(relationships, many=True).data

        return Response({
            "nodes": nodes_data,
            "edges": edges_data
        })
