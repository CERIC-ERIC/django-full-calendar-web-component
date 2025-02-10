class CalendarElement extends FullCalendarElement {
  constructor() {
    super(...arguments);
  }

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

  static _getColor(index) {
    return CalendarElement.EVENT_COLORS[
      index % CalendarElement.EVENT_COLORS.length
    ];
  }

  connectedCallback() {
    this._handleOptionsStr(this.getAttribute("options"));
  }

  _handleOptionsStr(optionsStr) {
    if (optionsStr.startsWith("global:")) {
      this._handleOptions(window[optionsStr.split(":")[1]]);
    } else {
      this._handleOptions(optionsStr ? JSON.parse(optionsStr) : null);
    }
  }

  _optionsToFullCalendar(options) {
    const newOptions = {
      initialView: options.initialView,
      views: options.views,
      headerToolbar: options.headerToolbar,
      nowIndicator: true,
      slotDuration: options.slotDuration,
      themeSystem: "bootstrap5",
      eventDidMount: (info) => {
        if (!info.isMirror) {
          new FCTooltip(info.el, info.event);
        }
      },
      eventWillUnmount: (info) => {
        if (!info.isMirror) {
          const tooltip = FCTooltip.getInstace(info.event);
          if (tooltip) {
            tooltip.dispose();
          }
        }
      },
      eventContent: function (info, createElement) {
        if (!info.isMirror) {
          const tooltip = FCTooltip.getInstace(info.event);
          if (tooltip) {
            // TODO: Update events data before updating the tooltip
            tooltip.update();
          }
        }

        // Return true to use the default renderer for the event
        return true;
      },
      editable: true,
      eventOverlap: false,
      eventResourceEditable: false,
    };

    // Add the Non-Commercial license key
    newOptions.schedulerLicenseKey =
      "CC-Attribution-NonCommercial-NoDerivatives";

    // create resources and events
    const proposals = [];
    const resources = [];
    const events = [];

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
          let resource = resources.find((r) => r.title === instrumentTitle);

          if (!resource) {
            resource = { id: resources.length, title: instrumentTitle };
            resources.push(resource);
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
          let proposal = proposals.find((p) => p.title === proposalTitle);

          if (!proposal) {
            proposal = { id: proposals.length, title: proposalTitle };
            proposals.push(proposal);
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

        events.push(newEvent);
      });
    }

    newOptions.resources = resources;
    newOptions.events = events;

    return newOptions;
  }

  _handleOptions(options) {
    const fullCalendarOptions = this._optionsToFullCalendar(options);
    return super._handleOptions(fullCalendarOptions);
  }
}

customElements.define("calendar-element", CalendarElement);
