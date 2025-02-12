from django import template
from django.conf import settings

register = template.Library()


@register.simple_tag
def get_fc_license():
    return (
        settings.FULL_CALENDAR_LICENSE_KEY
        if hasattr(settings, "FULL_CALENDAR_LICENSE_KEY")
        else None
    )
