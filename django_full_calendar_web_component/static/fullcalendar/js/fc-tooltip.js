class FCTooltip extends BaseTooltip {
  static TOOLTIP_INSTANCES = {};
  static DATE_FORMAT = {
    month: "numeric",
    year: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };

  static templates = null;

  eventInfo = null;
  extraInfo = null;
  permissions = null;
  state = {
    viewMode: "info", // 'info' or 'edit'
  };

  constructor(el, eventInfo, extraInfo, permissions) {
    super(el);
    this.eventInfo = eventInfo;
    this.extraInfo = extraInfo;
    this.permissions = permissions;

    // Initialize templates
    this.initTemplates();

    this.createTooltip();
    this.setupTooltipListeners();

    const instanceId = eventInfo._instance.instanceId;
    FCTooltip.TOOLTIP_INSTANCES[instanceId] = this;
  }

  initTemplates() {
    // Initialize Handlebars templates only once
    if (!FCTooltip.templates) {
      FCTooltip.templates = {};

      // Register all partials first
      const partials = document.querySelectorAll(
        'script[data-component="fctooltip"][data-type="partial"]'
      );
      partials.forEach((partial) => {
        const name = partial.getAttribute("data-name");
        Handlebars.registerPartial(name, partial.innerHTML);
      });

      // Then compile all templates
      const templates = document.querySelectorAll(
        'script[data-component="fctooltip"][data-type="template"]'
      );
      templates.forEach((template) => {
        const name = template.getAttribute("data-name");
        FCTooltip.templates[name] = Handlebars.compile(template.innerHTML);
      });
    }
  }

  static getInstance(eventInfo) {
    const instanceId = eventInfo._instance.instanceId;
    return FCTooltip.TOOLTIP_INSTANCES[instanceId] || null;
  }

  static disposeAll() {
    Object.values(FCTooltip.TOOLTIP_INSTANCES).forEach((tooltip) =>
      tooltip.dispose()
    );
  }

  createTooltip() {
    const tooltip = document.createElement("div");
    tooltip.className = "fc-tooltip";
    document.body.appendChild(tooltip);
    this.tooltip = tooltip;

    // Initial render
    this.render();
  }

  // Main render method that chooses the appropriate template
  render() {
    if (this.state.viewMode === "edit") {
      this.renderEditView();
    } else {
      this.renderInfoView();
    }
  }

  // Template for the info view using Handlebars
  renderInfoView() {
    const { eventInfo, extraInfo, permissions } = this;

    const startDate = FullCalendar.formatDate(
      eventInfo.start,
      FCTooltip.DATE_FORMAT
    );

    const endDate = FullCalendar.formatDate(
      eventInfo.end,
      FCTooltip.DATE_FORMAT
    );

    // Clear previous content
    this.tooltip.innerHTML = "";

    // Build actions based on permissions
    const actions = [];

    if (permissions.canEdit) {
      actions.push({
        label: "Edit event",
        icon: "edit",
        callback: () => this.setState({ viewMode: "edit" }),
      });
    }

    if (permissions.canDelete) {
      actions.push({
        label: "Delete event",
        icon: "trash-alt",
        callback: () => this.handleDeleteEvent(),
      });
    }

    this.tooltip.innerHTML = FCTooltip.templates.infoView({
      title: eventInfo.title,
      color: eventInfo.backgroundColor,
      actions: actions,
      extraInfo: extraInfo,
      startDate: startDate,
      endDate: endDate,
    });

    // Add event listeners to action buttons
    actions.forEach((action, index) => {
      const actionButton = this.tooltip.querySelector(
        `[data-action-index="${index}"]`
      );
      if (actionButton) {
        actionButton.addEventListener("click", (e) => {
          e.stopPropagation();
          action.callback();
        });
      }
    });

    // Add close button handler
    const closeButton = this.tooltip.querySelector(".close-btn");
    if (closeButton) {
      closeButton.addEventListener("click", () => this.hideTooltip());
    }
  }

  // Template for the edit view using Handlebars
  renderEditView() {
    // Clear previous content
    this.tooltip.innerHTML = "";

    // Format dates for input fields
    const formatDateTimeForInput = (date) => {
      return date.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
    };

    this.tooltip.innerHTML = FCTooltip.templates.editView({
      color: this.eventInfo.backgroundColor,
      actions: [], // No actions for edit view
      startDateInput: formatDateTimeForInput(this.eventInfo.start),
      endDateInput: formatDateTimeForInput(this.eventInfo.end),
    });

    // Add close button handler
    const closeButton = this.tooltip.querySelector(".close-btn");
    if (closeButton) {
      closeButton.addEventListener("click", () => this.hideTooltip());
    }

    // Add form button handlers
    const form = this.tooltip.querySelector("form");
    const saveButton = form.querySelector("#save-btn");
    saveButton.addEventListener("click", (e) => {
      e.preventDefault();
      this.handleSaveEvent(form);
    });

    const cancelButton = form.querySelector("#cancel-btn");
    cancelButton.addEventListener("click", (e) => {
      e.preventDefault();
      this.setState({ viewMode: "info" });
    });
  }

  // Handler for saving event changes
  handleSaveEvent(form) {
    // Get form values
    const startInput = form.querySelector("#event-start").value;
    const endInput = form.querySelector("#event-end").value;

    // Validate dates
    if (!startInput || !endInput) {
      alert("Both start and end dates are required");
      return;
    }

    const newStart = new Date(startInput);
    const newEnd = new Date(endInput);

    // Validate end is after start
    if (newEnd <= newStart) {
      alert("End date must be after start date");
      return;
    }

    // Update event dates using FullCalendar API
    this.eventInfo.setDates(newStart, newEnd);

    // Dispatch custom event for external listeners
    this.eventElem.dispatchEvent(
      new CustomEvent("fc:event-updated", {
        bubbles: true,
        detail: {
          eventId: this.eventInfo.id,
          newStart,
          newEnd,
        },
      })
    );

    // Switch back to info view
    this.setState({ viewMode: "info" });
  }

  // Handler for deleting an event
  handleDeleteEvent() {
    if (window.confirm("Are you sure you want to delete this event?")) {
      // Dispatch a custom event for deletion
      this.eventElem.dispatchEvent(
        new CustomEvent("fc:event-delete", {
          bubbles: true,
          detail: {
            eventId: this.eventInfo.id,
          },
        })
      );

      // Hide tooltip after deletion request
      this.hideTooltip();
    }
  }

  // Update state and re-render
  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.render();
  }

  setupTooltipListeners() {
    this.eventElem.addEventListener("click", this.handleEventClick);
  }

  dispose() {
    this.eventElem.removeEventListener("click", this.handleEventClick);
    this.removeListeners();
    this.tooltip.remove();
    delete FCTooltip.TOOLTIP_INSTANCES[this.eventInfo._instance.instanceId];
  }
}
