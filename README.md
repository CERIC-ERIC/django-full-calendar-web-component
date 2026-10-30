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
    "title": "Optional additional title",
    "executed_remotely": false,
    "extra_experimental_hours": 2,
    "sample_preparation_hours": 1,
    "data_analysis_hours": 3,
    "note": "Sample setup completed prior to run"
  },
  {
    "id": 2,
    "start": "2025-03-25T13:00:00",
    "end": "2025-03-25T15:00:00",
    "instrument": 124,
    "type": "reserved",
    "title": "Maintenance",
    "extra_experimental_hours": 0,
    "sample_preparation_hours": 0,
    "data_analysis_hours": 0,
    "note": "Scheduled calibration"
  }
]
```

##### Event Object Properties

| Property | Type | Description |
|---|---|---|
| `id` | String / Number | Unique identifier for the event. |
| `start` | String | Start datetime in ISO 8601 format. |
| `end` | String | End datetime in ISO 8601 format (or null/omitted for ongoing/open events). |
| `instrument` | String / Number | Identifier of the instrument associated with the event. |
| `type` | String | Event type: `"experiment"` or `"reserved"`. |
| `title` | String | Optional title for the event. |
| `proposal` | String / Number | Optional identifier of the associated proposal (for `"experiment"` type). |
| `executed_remotely` | Boolean | Optional flag indicating if the experiment was conducted remotely. |
| `extra_experimental_hours` | Number | Additional experimental/beamtime hours recorded for the event (default: 0). |
| `sample_preparation_hours` | Number | Dedicated sample preparation hours (default: 0). |
| `data_analysis_hours` | Number | Dedicated data analysis hours (default: 0). |
| `note` | String | Optional notes or observations recorded for the event. |

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

- **change**: Fired when an event is moved, resized, or modified via the Edit Event popup. The event `detail` object contains:
  - `changeInfo.event`: The updated FullCalendar event object, including `extendedProps` (`extra_experimental_hours`, `sample_preparation_hours`, `data_analysis_hours`, `note`).
  - `changeInfo.oldEvent`: The previous state of the event before modification.
- **remove**: Fired when an event is deleted via the Delete action button. The event `detail` object contains:
  - `removeInfo.event`: The FullCalendar event object to be removed.

## Releases and Versioning

This package follows [Semantic Versioning](https://semver.org/) (`<major>.<minor>.<patch>`):

- **Patch** release (`1.0.1`): Bug fixes, styling refinements, and backward-compatible patches.
- **Minor** release (`1.1.0`): New features, backward-compatible enhancements.
- **Major** release (`2.0.0`): Breaking changes or major architectural upgrades.

The single source of truth for the package version is `version` in `pyproject.toml`. Python code can inspect it at runtime via:
```python
import django_full_calendar_web_component
print(django_full_calendar_web_component.__version__)
```

---

### How to Create and Publish a New Release

#### Option 1: Automated Release Script (Recommended)

1. Make sure your changes are tested and committed to your branch (e.g. `feat/calendar-versioning` or `master`).
2. Run the release script with your target semantic version:
   ```bash
   ./scripts/release.sh 1.0.1
   ```
   This script automatically:
   - Validates semantic version syntax (`<major>.<minor>.<patch>`).
   - Updates `version = "1.0.1"` in `pyproject.toml`.
   - Runs the test suite to ensure the package is healthy.
   - Creates the release commit (`chore(release): release v1.0.1`).
   - Creates the annotated Git tag (`v1.0.1`).

3. Push the release commit and tag to GitHub:
   ```bash
   git push origin <your-branch> --tags
   # e.g.: git push origin feat/calendar-versioning --tags (or git push origin master --tags)
   ```

#### Option 2: Manual Release

1. Update the version in `pyproject.toml`:
   ```toml
   [project]
   version = "1.0.1"
   ```
2. Commit the version bump and create an annotated tag:
   ```bash
   git add pyproject.toml
   git commit -m "chore(release): release v1.0.1"
   git tag -a v1.0.1 -m "Release v1.0.1"
   ```
3. Push to GitHub with tags:
   ```bash
   git push origin <your-branch> --tags
   # e.g.: git push origin feat/calendar-versioning --tags (or git push origin master --tags)
   ```

---

### Automated GitHub Release Creation

When you push a tag matching `v*.*.*` to GitHub:
- The GitHub Actions workflow (`.github/workflows/release.yml`) automatically validates the tag against `pyproject.toml`.
- Runs unit tests in CI.
- Generates an official GitHub Release with auto-generated release notes.

---

### Consuming the New Version in PMS

Once a tag (e.g. `v1.0.1`) is pushed to GitHub:

1. **Check for available releases in PMS:**
   ```bash
   uv run pms-cli check-dependencies
   ```

2. **Upgrade PMS to the new release:**
   ```bash
   uv run pms-cli update-calendar 1.0.1
   ```
   *This automatically updates `pyproject.toml` and locks `uv.lock` to the new release tag.*

3. **Automated Dependabot PRs:**
   GitHub Dependabot in PMS will automatically detect the new release tag and open a Pull Request bumping the version.
