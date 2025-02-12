class CalendarElement extends HTMLElement {
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
    this._events = [];
    this._resources = [];
    this._proposals = [];
  }

  /**
   * Initialize the component
   */
  connectedCallback() {
    this.initEventSource();
    const fcOptions = this.getFullCalendarOptions();

    this.innerHTML = "<div></div>";
    let calendarEl = this.querySelector("div");
    let calendar = new FullCalendar.Calendar(calendarEl, fcOptions);
    calendar.render();
    this._calendar = calendar;
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

  /**
   * Get the initial value and initialize the event source
   * TODO: Refactor this method, this is just a demo implementation
   */
  initEventSource = () => {
    const events = JSON.parse(this.getAttribute("initial-value"));
    if (events?.length) {
      events.forEach((event) => {
        const newEvent = {
          id: event.id,
          start: event.start,
          end: event.end,
          extendedProps: {},
        };
        // Instruments are mapped to resources
        if (event.instrument) {
          newEvent.extendedProps = {
            ...newEvent.extendedProps,
            instrument: event.instrument,
          };
          const instrumentTitle = event.instrument;
          let resource = this._resources.find(
            (r) => r.title === instrumentTitle
          );

          if (!resource) {
            resource = { id: this._resources.length, title: instrumentTitle };
            this._resources.push(resource);
          }
          newEvent.resourceId = resource.id;
        }

        // Proposals sets the color and title
        if (event.proposal) {
          newEvent.extendedProps = {
            ...newEvent.extendedProps,
            proposal: event.proposal,
          };
          const proposalTitle = event.proposal;
          let proposal = this._proposals.find((p) => p.title === proposalTitle);

          if (!proposal) {
            proposal = { id: this._proposals.length, title: proposalTitle };
            this._proposals.push(proposal);
          }

          newEvent.title = proposal.title;
          newEvent.backgroundColor = CalendarElement.getEventColor(proposal.id);
          newEvent.borderColor = CalendarElement.getEventColor(proposal.id);
        }

        if (event.type) {
          newEvent.extendedProps = {
            ...newEvent.extendedProps,
            type: event.type,
          };
          newEvent.classNames = [`event--type-${event.type}`];

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

        this._events.push(newEvent);
      });
    }
  };

  /**
   * Prepare the FullCalendar options based on the attributes
   */
  getFullCalendarOptions = () => {
    const options = JSON.parse(this.getAttribute("options"));
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
      initialView: options.initialView,
      views: options.views,
      headerToolbar: options.headerToolbar,
      slotDuration: options.slotDuration,
      themeSystem: "bootstrap5",
      nowIndicator: true,

      // === Editing options ===
      editable: !isReadOnly,
      eventOverlap: false,
      eventResourceEditable: false,
    };
  };

  eventSource = (_fetchInfo, successCallback) => {
    successCallback(this._events);
  };

  resourceSource = (_fetchInfo, successCallback) => {
    successCallback(this._resources);
  };

  handleEventDidMount = (info) => {
    // only handle tooltips for non-mirror events
    if (!info.isMirror) {
      new FCTooltip(info.el, info.event);
    }
  };

  handleEventWillUnmount = (info) => {
    // only handle tooltips for non-mirror events
    if (!info.isMirror) {
      FCTooltip.getInstace(info.event)?.dispose();
    }
  };

  handleEventChange = (changeInfo) => {
    const eventIndex = this._events.findIndex(
      (e) => e.id === changeInfo.event.id
    );
    if (eventIndex !== -1) {
      // Update event source
      // TODO: Add support for other event properties update
      this._events[eventIndex] = {
        ...this._events[eventIndex],
        start: changeInfo.event.startStr,
        end: changeInfo.event.endStr,
      };

      // Update tooltip info if needed
      FCTooltip.getInstace(changeInfo.event)?.update(changeInfo.event);
    }
  };
}

customElements.define("calendar-element", CalendarElement);
