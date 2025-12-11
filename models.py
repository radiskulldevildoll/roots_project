from django.db import models
from django.utils.translation import gettext_lazy as _
import uuid

class Person(models.Model):
    """
    The central node. Represents a human being (living or dead).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Basic Info
    first_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100)
    maiden_name = models.CharField(max_length=100, blank=True, help_text="Birth surname if different")

    # The "Fuzzy" Dates - We store display strings for "Circa 1850" logic
    birth_date = models.DateField(null=True, blank=True)
    birth_date_fuzzy = models.CharField(max_length=50, blank=True, help_text="e.g. 'About 1900' or 'Winter 1890'")

    death_date = models.DateField(null=True, blank=True)
    is_living = models.BooleanField(default=True)

    # The "Rumor Mode" Flag
    confidence_level = models.IntegerField(default=100, help_text="0=Rumor, 100=Verified Fact")

    # Biography / Notes (Markdown supported)
    bio = models.TextField(blank=True)

    # Avatar/Headshot
    profile_picture = models.ImageField(upload_to='profiles/', null=True, blank=True)

    def full_name(self):
        return f"{self.first_name} {self.middle_name} {self.last_name}".replace("  ", " ")

class Relationship(models.Model):
    """
    Connects two people horizontally (Partners/Spouses).
    We use this to hang children off of.
    """
    class RelType(models.TextChoices):
        MARRIED = 'MAR', _('Married')
        PARTNER = 'PAR', _('Unmarried Partners')
        DIVORCED = 'DIV', _('Divorced')
        UNKNOWN = 'UNK', _('Unknown')

    person_a = models.ForeignKey(Person, related_name='relationships_a', on_delete=models.CASCADE)
    person_b = models.ForeignKey(Person, related_name='relationships_b', on_delete=models.CASCADE)

    relationship_type = models.CharField(max_length=3, choices=RelType.choices, default=RelType.MARRIED)

    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)

    # This allows us to add children to a specific COUPLE, not just a person
    children = models.ManyToManyField(Person, through='ParentChildLink', related_name='parents_relationship')

class ParentChildLink(models.Model):
    """
    Connects a child to a Relationship or a Single Parent.
    Handles Adoption vs Biological.
    """
    class LinkType(models.TextChoices):
        BIOLOGICAL = 'BIO', _('Biological')
        ADOPTED = 'ADO', _('Adopted')
        FOSTER = 'FOS', _('Foster')
        STEP = 'STP', _('Step-Child')

    child = models.ForeignKey(Person, related_name='parent_links', on_delete=models.CASCADE)

    # Link to the relationship (e.g., Mom & Dad)
    # OR a single parent if the other is unknown/irrelevant
    relationship = models.ForeignKey(Relationship, null=True, blank=True, on_delete=models.SET_NULL)
    single_parent = models.ForeignKey(Person, null=True, blank=True, related_name='single_children', on_delete=models.SET_NULL)

    link_type = models.CharField(max_length=3, choices=LinkType.choices, default=LinkType.BIOLOGICAL)
