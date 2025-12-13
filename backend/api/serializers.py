from rest_framework import serializers
from .models import Person, Relationship, ParentChildLink, Story, Media

class PersonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Person
        fields = '__all__'

class GraphNodeSerializer(serializers.ModelSerializer):
    """
    Nodes now include the profile picture URL.
    """
    label = serializers.SerializerMethodField()
    birth_year = serializers.SerializerMethodField()
    death_year = serializers.SerializerMethodField()

    class Meta:
        model = Person
        fields = ['id', 'label', 'profile_picture', 'birth_date_fuzzy', 'confidence_level', 
                  'birth_year', 'death_year', 'is_living']

    def get_label(self, obj):
        return obj.full_name()
    
    def get_birth_year(self, obj):
        if obj.birth_date:
            return obj.birth_date.year
        return None
    
    def get_death_year(self, obj):
        if obj.death_date:
            return obj.death_date.year
        return None

class RelationshipSerializer(serializers.ModelSerializer):
    person_a_obj = PersonSerializer(source='person_a', read_only=True)
    person_b_obj = PersonSerializer(source='person_b', read_only=True)

    class Meta:
        model = Relationship
        fields = '__all__'

class ParentChildLinkSerializer(serializers.ModelSerializer):
    child_obj = PersonSerializer(source='child', read_only=True)
    single_parent_obj = PersonSerializer(source='single_parent', read_only=True)
    relationship_obj = RelationshipSerializer(source='relationship', read_only=True)

    class Meta:
        model = ParentChildLink
        fields = '__all__'

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
    sourceHandle = serializers.SerializerMethodField()
    targetHandle = serializers.SerializerMethodField()

    class Meta:
        model = Relationship
        fields = ['id', 'source', 'target', 'animated', 'style', 'label', 'sourceHandle', 'targetHandle', 'relationship_type']

    def get_id(self, obj):
        return f"rel-{obj.id}"

    def get_label(self, obj):
        # Optional: Show 'Divorced' on the line itself
        return "Divorced" if obj.relationship_type == 'DIV' else ""

    def get_animated(self, obj):
        # Animate the line if it's an active marriage
        return obj.relationship_type == 'MAR' and not obj.end_date

    def get_sourceHandle(self, obj):
        # Return the handle ID for the source node
        return 'right'

    def get_targetHandle(self, obj):
        # Return the handle ID for the target node
        return 'left'

    def get_style(self, obj):
        """
        This is the tentative logic you asked for.
        """
        # Default Style (Verified)
        stroke = '#10b981' # Emerald 500
        stroke_width = 2
        stroke_dash = ''

        # Divorce logic
        if obj.relationship_type == 'DIV':
            stroke = '#ef4444' # Red 500
            stroke_dash = '2,2'

        return {
            'stroke': stroke,
            'strokeWidth': stroke_width,
            'strokeDasharray': stroke_dash
        }


class MediaSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.SerializerMethodField()
    tagged_people_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Media
        fields = '__all__'
        read_only_fields = ['uploaded_by', 'created_at']
    
    def get_uploaded_by_name(self, obj):
        return obj.uploaded_by.username if obj.uploaded_by else 'Unknown'
    
    def get_tagged_people_details(self, obj):
        return [{'id': str(p.id), 'name': p.full_name()} for p in obj.tagged_people.all()]


class StorySerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    tagged_people_details = serializers.SerializerMethodField()
    media_items = MediaSerializer(many=True, read_only=True)
    
    class Meta:
        model = Story
        fields = '__all__'
        read_only_fields = ['author', 'created_at', 'updated_at']
    
    def get_author_name(self, obj):
        return obj.author.username if obj.author else 'Unknown'
    
    def get_tagged_people_details(self, obj):
        return [{'id': str(p.id), 'name': p.full_name()} for p in obj.tagged_people.all()]
