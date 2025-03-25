# django-full-calendar-web-component

This app is an implementation for PMS of the calendar-element using the [FullCalendar](https://fullcalendar.io/) library.

## License and Use of FullCalendar

This project uses FullCalendar Premium. Depending on your use case, you may need to obtain a specific type of license:

- **Commercial Use**: For-profit companies and individuals must purchase a commercial license. This license allows source code modifications but does not permit redistribution of modifications.
- **Non-Commercial Use**: Registered non-profit organizations can use FullCalendar Premium with a free, non-commercial license. This license does not permit source code modifications.
- **GPLv3 Open-Source Projects**: Fully GPLv3-compliant open-source projects can use FullCalendar Premium freely under the GPLv3 license.

For more, and up-to-date information, visit the [FullCalendar License](https://fullcalendar.io/license) page.

### Setting the License Key in Django

To set the FullCalendar Premium license key in Django, add the following line to your Django settings file:

```python
FULL_CALENDAR_LICENSE_KEY = 'your_license_key_here'
```

Replace `'your_license_key_here'` with your actual FullCalendar Premium license key.

## Web Component

This app provides an html web component that integrates the FullCalendar library to render a fully interactive calendar in django. It is specially designed to be used as a experiments calendar in the PMS, but it can be used in any other html5 project.

### Basic Integration

Include the web component in your template:

```html
{% load static fc_license pages_tags %}
{% include "calendar_element/web_component.html" %}

<calendar-element 
    name="events" 
    value="[]"
    instruments="[]"
    proposals="[]"
    options='{"initialView":"resourceTimeGridWeek","slotDuration":"01:00:00","hasChangePermission":true,"hasDeletePermission":true}'>
</calendar-element>
```

### Web Component Attributes

The `<calendar-element>` supports the following attributes:

| Attribute     | Type     | Required | Description                                                    |
|---------------|----------|----------|----------------------------------------------------------------|
| `name`        | String   | Yes      | Form field name for the hidden input containing calendar data  |
| `value`       | JSON     | Yes      | Events data as a JSON string                                   |
| `instruments` | JSON     | Yes      | Resources/instruments data as a JSON string                     |
| `proposals`   | JSON     | Yes      | Proposal data as a JSON string                                 |
| `options`     | JSON     | Yes      | FullCalendar configuration options                             |
| `readonly`    | Boolean  | No       | If present, makes the calendar read-only                       |

### Data Formats

#### Events Format

```json
[
  {
    "id": 1,
    "start": "2025-03-24T09:00:00",
    "end": "2025-03-24T12:00:00",
    "instrument": 123,
    "proposal": 456,
    "type": "experiment",
    "title": "Optional additional title"
  },
  {
    "id": 2,
    "start": "2025-03-25T13:00:00",
    "end": "2025-03-25T15:00:00",
    "instrument": 124,
    "type": "reserved",
    "title": "Maintenance"
  }
]
```

#### Instruments Format

```json
[
  {
    "id": 123,
    "title": "Instrument Name",
    "url": "/instruments/123/"
  }
]
```

#### Proposals Format

```json
[
  {
    "id": 456,
    "title": "Proposal Title",
    "url": "/proposals/456/"
  }
]
```

#### Options Format

```json
{
  "initialView": "resourceTimeGridWeek",
  "views": {
    "resourceTimeGridDay": { "titleFormat": { "weekday": "long", "month": "long", "day": "numeric" } },
    "resourceTimeGridWeek": { "titleFormat": { "month": "long", "year": "numeric" } },
    "resourceTimeGridMonth": { "titleFormat": { "year": "numeric" } }
  },
  "headerToolbar": {
    "left": "prev,next today",
    "center": "title",
    "right": "resourceTimeGridDay,resourceTimeGridWeek,resourceTimeGridMonth"
  },
  "slotDuration": "01:00:00",
  "hasChangePermission": true,
  "hasDeletePermission": true
}
```

### Event Types

The calendar supports two types of events:

- **experiment**: Regular events associated with a proposal
- **reserved**: Reserved time slots (e.g., maintenance, holidays)

### Customization with Handlebars Templates

The calendar tooltips are customizable using Handlebars templates. The following templates are available:

1. **info_view.hbs**: Displays detailed information about an event
2. **edit_view.hbs**: Form for editing event details
3. **header_partial.hbs**: Common header used in both views

You can customize these templates in the `handlebars/` directory.

### Events

The component emits the following custom events:

- **change**: Fired when an event is moved or resized
- **remove**: Fired when an event is deleted
