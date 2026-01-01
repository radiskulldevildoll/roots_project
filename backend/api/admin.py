from django.contrib import admin
from .models import Person, Relationship, ParentChildLink, Story, Media, Feedback

@admin.register(Person)
class PersonAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'birth_date', 'is_living', 'confidence_level')
    search_fields = ('first_name', 'last_name', 'bio')
    list_filter = ('is_living', 'confidence_level')

@admin.register(Relationship)
class RelationshipAdmin(admin.ModelAdmin):
    list_display = ('person_a', 'person_b', 'relationship_type', 'start_date')
    list_filter = ('relationship_type',)

@admin.register(ParentChildLink)
class ParentChildLinkAdmin(admin.ModelAdmin):
    list_display = ('child', 'link_type', 'relationship', 'single_parent')
    list_filter = ('link_type',)

@admin.register(Story)
class StoryAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'event_date', 'is_public', 'created_at')
    search_fields = ('title', 'content')
    list_filter = ('is_public', 'author')

@admin.register(Media)
class MediaAdmin(admin.ModelAdmin):
    list_display = ('title', 'media_type', 'uploaded_by', 'created_at')
    list_filter = ('media_type', 'uploaded_by')

@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ('title', 'feedback_type', 'user', 'status', 'created_at')
    list_filter = ('feedback_type', 'status', 'created_at')
    search_fields = ('title', 'description')
    readonly_fields = ('created_at',)
