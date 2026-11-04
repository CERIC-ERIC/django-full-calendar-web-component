import os
import unittest
import django
from django.conf import settings
from django.template.loader import render_to_string

# Configure minimal Django settings for testing
if not settings.configured:
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    settings.configure(
        DEBUG=True,
        SECRET_KEY="test-secret-key",
        INSTALLED_APPS=[
            "django.contrib.staticfiles",
            "django_full_calendar_web_component",
        ],
        STATIC_URL="/static/",
        TEMPLATES=[
            {
                "BACKEND": "django.template.backends.django.DjangoTemplates",
                "APP_DIRS": True,
                "OPTIONS": {
                    "context_processors": [],
                },
            }
        ],
        FULL_CALENDAR_LICENSE_KEY="CC-Attribution-NonCommercial-NoDerivatives",
    )
    django.setup()


class FullCalendarTemplateTests(unittest.TestCase):
    def test_debug_mode_template_rendering(self):
        content = render_to_string("calendar_element/web_component.html", {"debug": True})

        # Check v7.1.3 CSS files
        self.assertIn("https://cdn.jsdelivr.net/npm/fullcalendar@7.1.3/skeleton.css", content)
        self.assertIn("https://cdn.jsdelivr.net/npm/@fullcalendar/bootstrap5@7.1.3/theme.css", content)

        # Check v7.1.3 JS files
        self.assertIn("https://cdn.jsdelivr.net/npm/fullcalendar@7.1.3/all/global.js", content)
        self.assertIn("https://cdn.jsdelivr.net/npm/fullcalendar-scheduler@7.1.3/all/global.js", content)
        self.assertIn("https://cdn.jsdelivr.net/npm/@fullcalendar/bootstrap5@7.1.3/global.js", content)

        # Ensure old version 6.1.15 is gone
        self.assertNotIn("6.1.15", content)
        self.assertNotIn("index.global.js", content)

        # License key and handlebar templates
        self.assertIn('window.__FC_LICENSE_KEY = "CC-Attribution-NonCommercial-NoDerivatives"', content)
        self.assertIn('data-name="headerPartial"', content)
        self.assertIn('data-name="infoView"', content)
        self.assertIn('data-name="editView"', content)

    def test_production_mode_template_rendering(self):
        content = render_to_string("calendar_element/web_component.html", {"debug": False})

        # Check v7.1.3 minified CSS files
        self.assertIn("https://cdn.jsdelivr.net/npm/fullcalendar@7.1.3/skeleton.min.css", content)
        self.assertIn("https://cdn.jsdelivr.net/npm/@fullcalendar/bootstrap5@7.1.3/theme.min.css", content)

        # Check v7.1.3 minified JS files
        self.assertIn("https://cdn.jsdelivr.net/npm/fullcalendar@7.1.3/all/global.min.js", content)
        self.assertIn("https://cdn.jsdelivr.net/npm/fullcalendar-scheduler@7.1.3/all/global.min.js", content)
        self.assertIn("https://cdn.jsdelivr.net/npm/@fullcalendar/bootstrap5@7.1.3/global.min.js", content)

        # Ensure old version 6.1.15 is gone
        self.assertNotIn("6.1.15", content)
        self.assertNotIn("index.global.min.js", content)

        # License key
        self.assertIn('window.__FC_LICENSE_KEY = "CC-Attribution-NonCommercial-NoDerivatives"', content)


if __name__ == "__main__":
    unittest.main()
