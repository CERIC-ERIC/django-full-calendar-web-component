class CalendarElement extends FullCalendarElement {
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

  static _getColor = (index) => {
    return CalendarElement.EVENT_COLORS[
      index % CalendarElement.EVENT_COLORS.length
    ];
  };

  connectedCallback() {
    super.connectedCallback();
    // Init the django field
    const inputName = this.getAttribute("name");
    if (inputName) {
      this.input = document.createElement("input");
      this.input.type = "hidden";
      this.input.name = inputName;
      this.appendChild(this.input);
    }
  }

  // fast access data in memory
  events = [];
  resources = [];
  proposals = [];

  eventSource = (_fetchInfo, successCallback) => {
    successCallback(this.events);
  };

  resourceSource = (_fetchInfo, successCallback) => {
    successCallback(this.resources);
  };

  updateEventSource = (options) => {
    if (options.events?.length) {
      options.events.forEach((event) => {
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
          let resource = this.resources.find(
            (r) => r.title === instrumentTitle
          );

          if (!resource) {
            resource = { id: this.resources.length, title: instrumentTitle };
            this.resources.push(resource);
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
          let proposal = this.proposals.find((p) => p.title === proposalTitle);

          if (!proposal) {
            proposal = { id: this.proposals.length, title: proposalTitle };
            this.proposals.push(proposal);
          }

          newEvent.title = proposal.title;
          newEvent.backgroundColor = CalendarElement._getColor(proposal.id);
          newEvent.borderColor = CalendarElement._getColor(proposal.id);
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

        this.events.push(newEvent);
      });
    }
  };

  updateEvent = (event) => {
    const eventIndex = this.events.findIndex((e) => e.id === event.id);
    if (eventIndex !== -1) {
      this.events[eventIndex] = {
        ...this.events[eventIndex],
        start: event.startStr,
        end: event.endStr,
      };
      const tooltip = FCTooltip.getInstace(event);
      if (tooltip) {
        tooltip.update(event);
      }
    }
  };

  handleEventMount = (info) => {
    new FCTooltip(info.el, info.event);
  };

  handleEventUnmount = (info) => {
    FCTooltip.getInstace(info.event)?.dispose();
  };

  handleEventUpdate = (changeInfo) => {
    const eventIndex = this.events.findIndex(
      (e) => e.id === changeInfo.event.id
    );
    if (eventIndex !== -1) {
      // Update event in memory
      this.events[eventIndex] = {
        ...this.events[eventIndex],
        start: changeInfo.event.startStr,
        end: changeInfo.event.endStr,
      };

      // Update tooltip info
      FCTooltip.getInstace(changeInfo.event)?.update(changeInfo.event);

      // Update django input value
    }
  };

  _optionsToFullCalendar = (options) => {
    return {
      // === License key ===
      schedulerLicenseKey: "CC-Attribution-NonCommercial-NoDerivatives",

      // === Event/Resource sources ===
      events: this.eventSource,
      resources: this.resourceSource,

      // === Event handlers ===
      eventDidMount: (info) => {
        // We want to ignore the mirror events
        if (!info.isMirror) {
          this.handleEventMount(info);
        }
      },
      eventWillUnmount: (info) => {
        // We want to ignore the mirror events
        if (!info.isMirror) {
          this.handleEventMount(info);
        }
      },
      eventChange: this.handleEventUpdate,

      // === Display options ===
      initialView: options.initialView,
      views: options.views,
      headerToolbar: options.headerToolbar,
      slotDuration: options.slotDuration,
      themeSystem: "bootstrap5",
      nowIndicator: true,

      // === Editing options ===
      editable: !options.readOnly,
      eventOverlap: false,
      eventResourceEditable: false,
    };
  };

  _handleOptions = (options) => {
    // Parse pms-calendar options and convert them to fullcalendar options
    const fullCalendarOptions = this._optionsToFullCalendar(options);

    // Update the event source
    this.updateEventSource(options);

    // Force the shadow attribute to be false
    this.removeAttribute("shadow");

    // Call the parent method
    return super._handleOptions(fullCalendarOptions);
  };
}

customElements.define("calendar-element", CalendarElement);
