class CalendarElement extends HTMLElement {
  // Define the observed attributes for the field use case
  static observedAttributes = [
    "value",
    "name",
    "options",
    "instruments",
    "proposals",
  ];

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

  static RESERVED_BG = "#9e9e9e";

  static getEventColor = (colorIndex) => {
    return CalendarElement.EVENT_COLORS[
      colorIndex % CalendarElement.EVENT_COLORS.length
    ];
  };

  constructor() {
    super(...arguments);
    this._calendar = null;
    this._input = null;
    this._proposals = [];
  }

  refetchProposals = () => {
    this._proposals = JSON.parse(this.getAttribute("proposals"));
  };

  /**
   * Initialize/update the calendar when options change
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
      calendar.render();
      this._calendar = calendar;
    }
  }

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

  /**
   * Initialize the component
   */
  connectedCallback() {
    this.refetchProposals();
    this.handleOptions(this.getAttribute("options"));
    this.handleValue(this.getAttribute("value"), this.getAttribute("name"));
  }

  /**
   * Clean up the component
   */
  disconnectedCallback() {
    // destroy the calendar
    this._calendar.destroy();
    // dispose all tooltips
    FCTooltip.disposeAll();
  }

  eventToFCEvent = (event) => {
    const newEvent = {
      id: event.id,
      start: event.start,
      end: event.end,
      extendedProps: {},
      classNames: ["fc-event-clickable"],
    };

    if (event.instrument) {
      // instrument id is used as resourceId
      newEvent.resourceId = event.instrument;
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

  /**
   * Prepare the FullCalendar options based on the attributes
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
   * Event sources to get the events from the value attribute
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

  resourceSource = (_fetchInfo, successCallback) => {
    try {
      // create resources from the instruments
      const instruments = JSON.parse(this.getAttribute("instruments"));
      successCallback(instruments);
    } catch (error) {
      failureCallback(error);
    }
  };

  handleEventDidMount = (info) => {
    console.log("mount");
    // only handle tooltips for non-mirror events
    if (!info.isMirror) {
      const tooltipActions = [];

      if (this._options.hasChangePermission) {
        tooltipActions.push({
          label: "Edit event",
          icon: "edit",
          callback: (event) => {
            this.editEvent(event.id);
          },
        });
      }

      if (this._options.hasDeletePermission) {
        tooltipActions.push({
          label: "Delete event",
          icon: "trash-alt",
          callback: (event) => {
            this.deleteEvent(event.id);
          },
        });
      }

      new FCTooltip(info.el, info.event, this._calendar, tooltipActions);
    }
  };

  handleEventWillUnmount = (info) => {
    // only handle tooltips for non-mirror events
    if (!info.isMirror) {
      FCTooltip.getInstace(info.event)?.dispose();
    }
  };

  editEvent = (eventId) => {};

  deleteEvent = (eventId) => {};

  handleEventChange = (changeInfo) => {
    // write changes into the attribute
    const events = JSON.parse(this.getAttribute("value"));
    const eventIndex = events.findIndex((e) => e.id === changeInfo.event.id);

    // only update start and end as ISO strings
    events[eventIndex].start = changeInfo.event.start.toISOString();
    events[eventIndex].end = changeInfo.event.end.toISOString();

    this.setAttribute("value", JSON.stringify(events));
  };

  addEvent = (event) => {
    const events = JSON.parse(this.getAttribute("value"));
    events.push(event);
    this.setAttribute("value", JSON.stringify(events));
  };

  attributeChangedCallback(name) {
    // Update the calendar options
    if (name === "options" && this._calendar) {
      console.log("cambio options");
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

    // refetch instruments
    if (name === "instruments" && this._calendar) {
      this._calendar.refetchResources();
    }

    // refetch proposals
    if (name === "proposals" && this._calendar) {
      this.refetchProposals();
    }
  }
}

customElements.define("calendar-element", CalendarElement);
