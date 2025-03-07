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

## Example Usage

Below is an example of how to use the calendar component and listen to its custom events:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Calendar Component Demo</title>
  <link rel="stylesheet" href="path/to/fullcalendar/bootstrap5.min.css">
  <script src="path/to/fullcalendar/main.min.js"></script>
  <script src="path/to/web-component.js"></script>
  <script src="path/to/fc-tooltip.js"></script>
</head>
<body>
  <calendar-element
    options='{
      "initialView": "dayGridMonth",
      "headerToolbar": {"left": "prev,next today", "center": "title", "right": "dayGridMonth,timeGridWeek,timeGridDay"},
      "slotDuration": "00:30:00",
      "hasChangePermission": true,
      "hasDeletePermission": true
    }'
    initial-value='[
      {
        "id": 1,
        "start": "2025-03-10T09:00:00",
        "end": "2025-03-10T10:00:00",
        "title": "Meeting",
        "proposal": {"id": 101, "name": "Project Kickoff"},
        "instrument": {"id": 201, "name": "Room A"},
        "type": "meeting"
      }
    ]'>
  </calendar-element>

  <script>
    const calendarElement = document.querySelector('calendar-element');

    calendarElement.addEventListener('edit-event', (e) => {
      console.log('Edit event triggered for event ID:', e.detail.eventId);
      // Implement your edit functionality here.
    });

    calendarElement.addEventListener('delete-event', (e) => {
      console.log('Delete event triggered for event ID:', e.detail.eventId);
      // Implement your delete functionality here.
    });

    calendarElement.addEventListener('change-event', (e) => {
      console.log('Event changed:', e.detail.changeInfo);
      // Handle updates (e.g., update the backend).
    });
  </script>
</body>
</html>
```

## Component attributes and events

### Attributes

- **options:**  
  A JSON string that configures the calendar. It includes settings for initial view, header toolbar, slot duration, and permissions (e.g., `hasChangePermission` and `hasDeletePermission`).

- **initial-value:**  
  A JSON string representing the initial set of events. Each event can include properties such as `id`, `start`, `end`, `title`, `proposal`, `instrument`, and `type`.

- **readonly (optional):**  
  When this attribute is present, the calendar disables editing functionalities.

### Custom Events

- **edit-event:**  
  Emitted when the "Edit event" action is triggered from a tooltip. The event detail contains the `eventId` for the event to be edited.

- **delete-event:**  
  Emitted when an event is deleted. The event detail contains the `eventId` of the removed event.

- **change-event:**  
  Emitted when an event is modified (e.g., its time changes due to dragging). The event detail includes information about the change.
