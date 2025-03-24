/**
 * Calendar Web Component
 *
 * A custom HTML element that integrates FullCalendar with Django forms.
 * Manages calendar events, proposals, instruments, and user interactions.
 */
class CalendarElement extends HTMLElement {
  /**
   * Attributes that trigger attributeChangedCallback when modified
   */
  static observedAttributes = [
    "value",
    "name",
    "options",
    "instruments",
    "proposals",
  ];

  /**
   * Color palette for different events
   */
  static EVENT_COLORS = [
    "#2196f3",
    "#009688",
    "#ff9800",
    "#9c27b0",
    "#f44336",
    "#673ab7",
    "#e91e63",
    "#03a9f4",
    "#3f51b5",
    "#4caf50",
    "#ffc107",
    "#8bc34a",
    "#795548",
    "#607d8b",
    "#ff5722",
    "#cddc39",
  ];

  /**
   * Background color for reserved events
   */
  static RESERVED_BG = "#9e9e9e";

  /**
   * Get a color from the palette based on an index
   */
  static getEventColor = (colorIndex) => {
    return CalendarElement.EVENT_COLORS[
      colorIndex % CalendarElement.EVENT_COLORS.length
    ];
  };

  /**
   * Initialize component state
   */
  constructor() {
    super(...arguments);
    this._calendar = null;
    this._input = null;
    this._proposals = [];
    this._instruments = [];
  }

  //==============================================================
  // HTML ELEMENT LIFECYCLE METHODS
  //==============================================================

  /**
   * Called when the element is added to the DOM
   * Initialize the calendar and data
   */
  connectedCallback() {
    this.fetchInstruments();
    this.fetchProposals();
    this.handleOptions(this.getAttribute("options"));
    this.handleValue(this.getAttribute("value"), this.getAttribute("name"));
  }

  /**
   * Called when the element is removed from the DOM
   * Clean up resources to prevent memory leaks
   */
  disconnectedCallback() {
    // destroy the calendar
    this._calendar.destroy();
    // dispose all tooltips
    FCTooltip.disposeAll();
  }

  /**
   * Called when an observed attribute changes
   * Update component state accordingly
   */
  attributeChangedCallback(name) {
    // Update the calendar options
    if (name === "options" && this._calendar) {
      this.handleOptions(this.getAttribute("options"));
    }

    // Update the input value and name
    if (["name", "value"].includes(name)) {
      this.handleValue(this.getAttribute("value"), this.getAttribute("name"));
    }

    // refetch calendar events
    if (name === "value" && this._calendar) {
      this._calendar.refetchEvents();
    }

    // refetch proposals
    if (name === "proposals" && this._calendar) {
      this.fetchProposals();
    }

    // refetch instruments
    if (name === "instruments" && this._calendar) {
      this.fetchInstruments();
      this._calendar.refetchResources();
    }
  }

  //==============================================================
  // ATTRIBUTE HANDLING METHODS
  //==============================================================

  /**
   * Parse options and initialize/update the calendar
   */
  handleOptions(optionsStr) {
    this._options = JSON.parse(optionsStr);
    if (this._calendar) {
      this._calendar.resetOptions(this._options);
    } else {
      const fcOptions = this.getFullCalendarOptions();
      let calendarEl = document.createElement("div");
      this.appendChild(calendarEl);
      let calendar = new FullCalendar.Calendar(calendarEl, fcOptions);
      this._calendar = calendar;
      calendar.render();
    }
  }

  /**
   * Create or update the hidden input that sends data to the server
   */
  handleValue(value, name) {
    if (!this._input) {
      this._input = document.createElement("input");
      this._input.type = "hidden";
      this._input.name = name;
      // This input is only intended to send the value to the server
      this._input.readOnly = true;
      this.appendChild(this._input);
    }
    this._input.name = name;
    this._input.value = value;
  }

  //==============================================================
  // DATA FETCHING AND TRANSFORMATION METHODS
  //==============================================================

  /**
   * Load proposals data from attribute
   */
  fetchProposals = () => {
    this._proposals = JSON.parse(this.getAttribute("proposals"));
  };

  /**
   * Load instruments data from attribute
   */
  fetchInstruments = () => {
    this._instruments = JSON.parse(this.getAttribute("instruments"));
  };

  /**
   * Convert an event object to FullCalendar format
   */
  eventToFCEvent = (event) => {
    const newEvent = {
      id: `${event.id}`,
      start: event.start,
      end: event.end,
      extendedProps: {},
      classNames: ["fc-event-clickable"],
    };

    if (event.instrument) {
      // instrument id is used as resourceId
      newEvent.resourceId = `${event.instrument}`;
    }

    // Proposals sets the color and title
    if (event.proposal) {
      newEvent.extendedProps = {
        ...newEvent.extendedProps,
        proposal: event.proposal,
      };
      const proposal = this._proposals.find((p) => p.id === event.proposal);

      const proposalIndex = this._proposals.indexOf(proposal);

      const proposalColor = CalendarElement.getEventColor(proposalIndex);

      newEvent.title = proposal.title;

      newEvent.backgroundColor = proposalColor;
      newEvent.borderColor = proposalColor;
    }

    if (event.type) {
      newEvent.extendedProps = {
        ...newEvent.extendedProps,
        type: event.type,
      };
      newEvent.classNames = [
        ...newEvent.classNames,
        `event--type-${event.type}`,
      ];

      if (event.type === "reserved") {
        newEvent.backgroundColor = CalendarElement.RESERVED_BG;
        newEvent.borderColor = CalendarElement.RESERVED_BG;
        newEvent.title = "Reserved";
      }
    }

    // Concat event title
    if (event.title) {
      newEvent.title = newEvent.title
        ? `${newEvent.title}: ${event.title}`
        : event.title;
    }

    return newEvent;
  };

  //==============================================================
  // FULLCALENDAR CONFIGURATION METHODS
  //==============================================================

  /**
   * Generate FullCalendar configuration options
   */
  getFullCalendarOptions = () => {
    const isReadOnly = this.hasAttribute("readonly");

    return {
      // === License key ===
      schedulerLicenseKey: window.__FC_LICENSE_KEY, // Don't modify this line, check the README for more information

      // === Event/Resource sources ===
      events: this.eventSource,
      resources: this.resourceSource,

      // === Event handlers ===
      eventDidMount: this.handleEventDidMount,
      eventWillUnmount: this.handleEventWillUnmount,
      eventChange: this.handleEventChange,

      // === Display options ===
      initialView: this._options.initialView,
      views: this._options.views,
      headerToolbar: this._options.headerToolbar,
      slotDuration: this._options.slotDuration,
      themeSystem: "bootstrap5",
      nowIndicator: true,
      resourceAreaHeaderContent: "Instruments",
      resourceAreaWidth: "200px",
      filterResourcesWithEvents: true,

      // === Editing options ===
      editable: this._options.hasChangePermission && !isReadOnly,
      eventOverlap: false,
      eventResourceEditable: false,
    };
  };

  /**
   * Provide events data to FullCalendar
   */
  eventSource = (_fetchInfo, successCallback, failureCallback) => {
    try {
      const events = JSON.parse(this.getAttribute("value"));
      const fcEvents = events.map(this.eventToFCEvent);
      successCallback(fcEvents);
    } catch (error) {
      failureCallback(error);
    }
  };

  /**
   * Provide resources data to FullCalendar
   */
  resourceSource = (_fetchInfo, successCallback) => {
    try {
      // create resources from the instruments
      successCallback(this._instruments);
    } catch (error) {
      failureCallback(error);
    }
  };

  //==============================================================
  // EVENT HANDLING METHODS
  //==============================================================

  /**
   * Called when an event is added to the DOM
   * Sets up tooltips and event listeners
   */
  handleEventDidMount = (info) => {
    // only handle tooltips for non-mirror events
    if (!info.isMirror) {
      const instrumentId = info.event.getResources().map((r) => r.id)[0];
      const instrument = this._instruments.find((i) => i.id === instrumentId);

      const proposal = this._proposals.find(
        (p) => p.id === info.event.extendedProps.proposal
      );

      // Add event listeners for tooltip custom events
      info.el.addEventListener("fc:event-delete", (e) => {
        this.deleteEvent(e.detail.eventId);
      });

      info.el.addEventListener("fc:event-updated", (e) => {
        // If we need any additional logic beyond what FullCalendar already handles
        // We can add it here
      });

      new FCTooltip(
        info.el,
        info.event,
        {
          type: info.event.extendedProps.type,
          instrument,
          proposal,
        },
        {
          canEdit: this._options.hasChangePermission,
          canDelete: this._options.hasDeletePermission,
        }
      );
    }
  };

  /**
   * Called when an event is removed from the DOM
   * Cleans up tooltips
   */
  handleEventWillUnmount = (info) => {
    // only handle tooltips for non-mirror events
    if (!info.isMirror) {
      FCTooltip.getInstance(info.event)?.dispose();
    }
  };

  /**
   * Called when an event is changed by drag/resize
   * Updates the underlying data
   */
  handleEventChange = (changeInfo) => {
    // write changes into the attribute
    const events = JSON.parse(this.getAttribute("value"));
    const eventIndex = events.findIndex(
      (e) => `${e.id}` === `${changeInfo.event.id}`
    );

    // only update start and end as ISO strings
    events[eventIndex].start = changeInfo.event.start.toISOString();
    events[eventIndex].end = changeInfo.event.end.toISOString();

    this.setAttribute("value", JSON.stringify(events));

    // dispatch custom event and bubble it up
    this.dispatchEvent(
      new CustomEvent("change", {
        bubbles: true,
        detail: { changeInfo },
      })
    );
  };

  //==============================================================
  // EVENT MANIPULATION METHODS
  //==============================================================

  /**
   * Placeholder for event editing functionality
   */
  editEvent = (eventId) => {};

  /**
   * Delete an event after confirmation
   */
  deleteEvent = (eventId) => {
    const events = JSON.parse(this.getAttribute("value"));
    const eventIndex = events.findIndex((e) => `${e.id}` === `${eventId}`);
    events.splice(eventIndex, 1);
    this.setAttribute("value", JSON.stringify(events));
  };

  /**
   * Add a new event to the calendar
   */
  addEvent = (event) => {
    const events = JSON.parse(this.getAttribute("value"));
    events.push(event);
    this.setAttribute("value", JSON.stringify(events));
  };
}

// Register the custom element
customElements.define("calendar-element", CalendarElement);
