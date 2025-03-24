from django import template, conf
from django.utils.safestring import mark_safe
import os.path

register = template.Library()

@register.simple_tag
def include_handlebars_template(path):
    """
    Include a handlebars template file directly from the handlebars directory.
    These templates are not Django templates.
    """
    # Get the base directory where this file is located
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    # Path to the handlebars directory
    handlebars_dir = os.path.join(base_dir, 'handlebars')
    # Create the full file path
    filepath = os.path.join(handlebars_dir, path)
    
    if not os.path.isfile(filepath):
        raise FileNotFoundError(f"Handlebars template not found: {filepath}")
        
    with open(filepath, 'r') as fp:
        return mark_safe(fp.read())
