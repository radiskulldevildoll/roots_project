from rest_framework import serializers
from .models import Person, Relationship, ParentChildLink

class PersonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Person
        fields = '__all__'

class GraphNodeSerializer(serializers.ModelSerializer):
    """
    Nodes now include the profile picture URL.
    """
    label = serializers.SerializerMethodField()

    class Meta:
        model = Person
        fields = ['id', 'label', 'profile_picture', 'birth_date_fuzzy', 'confidence_level']

    def get_label(self, obj):
        return obj.full_name()

class GraphEdgeSerializer(serializers.ModelSerializer):
    """
    The 'Smart Edge'. It calculates its own styling based on confidence.
    """
    source = serializers.ReadOnlyField(source='person_a.id')
    target = serializers.ReadOnlyField(source='person_b.id')
    id = serializers.SerializerMethodField()

    # React Flow specific fields
    animated = serializers.SerializerMethodField()
    style = serializers.SerializerMethodField()
    label = serializers.SerializerMethodField()

    class Meta:
        model = Relationship
        fields = ['id', 'source', 'target', 'animated', 'style', 'label']

    def get_id(self, obj):
        return f"rel-{obj.id}"

    def get_label(self, obj):
        # Optional: Show 'Divorced' on the line itself
        return "Divorced" if obj.relationship_type == 'DIV' else ""

    def get_animated(self, obj):
        # Animate the line if it's an active marriage
        return obj.relationship_type == 'MAR' and not obj.end_date

    def get_style(self, obj):
        """
        This is the tentative logic you asked for.
        """
        # Default Style (Verified)
        stroke = '#10b981' # Emerald 500
        stroke_width = 2
        stroke_dash = ''

        # Tentative / Rumor logic
        # Assuming we added a 'confidence_level' field to Relationship model
        if getattr(obj, 'confidence_level', 100) < 90:
            stroke = '#f59e0b' # Amber 500 (Warning color)
            stroke_dash = '5,5' # Dashed line

        if obj.relationship_type == 'DIV':
            stroke = '#ef4444' # Red 500
            stroke_dash = '2,2'

        return {
            'stroke': stroke,
            'strokeWidth': stroke_width,
            'strokeDasharray': stroke_dash
        }
