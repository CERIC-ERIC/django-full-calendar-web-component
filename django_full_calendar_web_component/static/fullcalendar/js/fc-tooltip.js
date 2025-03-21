class FCTooltip extends BaseTooltip {
  static TOOLTIP_INSTANCES = {};
  static DATE_FORMAT = {
    month: "numeric",
    year: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };

  eventInfo = null;
  extraInfo = null;
  actions = null;
  state = {
    viewMode: "info", // 'info' or 'edit'
  };

  constructor(el, eventInfo, extraInfo, actions) {
    super(el);
    this.eventInfo = eventInfo;
    this.extraInfo = extraInfo;
    this.actions = actions;
    this.createTooltip();
    this.setupTooltipListeners();

    const instanceId = eventInfo._instance.instanceId;
    FCTooltip.TOOLTIP_INSTANCES[instanceId] = this;
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

  // Template for the info view
  renderInfoView() {
    const { eventInfo, extraInfo, actions } = this;

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

    // Create header template
    const header = this.createHeader(
      eventInfo.title,
      eventInfo.backgroundColor,
      actions
    );
    this.tooltip.appendChild(header);

    // Create body template
    const body = document.createElement("div");
    body.className = "fc-tooltip__body";

    body.innerHTML = `
      <b>Type:</b> ${extraInfo.type || ""}<br>
      ${
        extraInfo.proposal
          ? `<b>Proposal:</b> ${
              extraInfo.proposal.url
                ? `<a href="${extraInfo.proposal.url}">${extraInfo.proposal.title}</a>`
                : extraInfo.proposal.title
            }<br>`
          : ""
      }
      ${
        extraInfo.instrument
          ? `<b>Instrument:</b> ${
              extraInfo.instrument.url
                ? `<a href="${extraInfo.instrument.url}">${extraInfo.instrument.title}</a>`
                : extraInfo.instrument.title
            }<br>`
          : ""
      }
      <b>From:</b> ${startDate}<br>
      <b>To:</b> ${endDate}
    `;

    this.tooltip.appendChild(body);
  }

  // Template for the edit view
  renderEditView() {
    // Clear previous content
    this.tooltip.innerHTML = "";

    // Create header
    const header = this.createHeader(
      "Edit Event",
      this.eventInfo.backgroundColor
    );

    this.tooltip.appendChild(header);

    // Create edit form
    const form = document.createElement("form");
    form.className = "fc-tooltip__body";

    // Format dates for input fields
    const formatDateTimeForInput = (date) => {
      return date.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
    };

    // Form with only start and end date fields
    form.innerHTML = `
      <div class="form-group">
        <label>Start Date</label>
        <input type="datetime-local" class="form-control" id="event-start" value="${formatDateTimeForInput(
          this.eventInfo.start
        )}">
      </div>
      <div class="form-group">
        <label>End Date</label>
        <input type="datetime-local" class="form-control" id="event-end" value="${formatDateTimeForInput(
          this.eventInfo.end
        )}">
      </div>
      <button type="button" class="btn btn-primary btn-sm mt-2">Save Changes</button>
      <button type="button" class="btn btn-secondary btn-sm mt-2">Cancel</button> 
    `;

    // Add form submit handler
    const saveButton = form.querySelector("button");
    saveButton.addEventListener("click", (e) => {
      e.preventDefault();

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

      // Switch back to info view
      this.setState({ viewMode: "info" });
    });

    this.tooltip.appendChild(form);
  }

  // Helper method to create the header section
  createHeader(title, color, actions = []) {
    const titleBox = document.createElement("div");
    titleBox.className = "fc-tooltip__title-box";

    const colorDot = document.createElement("i");
    colorDot.className = "fc-daygrid-event-dot";
    colorDot.style.borderColor = color;
    titleBox.append(colorDot);

    const titleSpan = document.createElement("span");
    titleSpan.className = "fc-tooltip__title";
    titleSpan.textContent = title;
    titleBox.appendChild(titleSpan);

    // Add action buttons
    actions.forEach((action) => {
      const actionButton = document.createElement("button");
      actionButton.title = action.label;
      actionButton.className = "fc-tooltip__action-button";
      actionButton.innerHTML = `<i class='fas fa-${action.icon}'></i>`;
      actionButton.addEventListener("click", (e) => {
        e.stopPropagation();
        action.callback(this.eventInfo);
      });
      titleBox.appendChild(actionButton);
    });

    // Always add close button
    const closeButton = document.createElement("button");
    closeButton.title = "Close";
    closeButton.className = "fc-tooltip__action-button";
    closeButton.innerHTML = "<i class='btn-close'></i>";
    closeButton.addEventListener("click", () => {
      this.hideTooltip();
    });
    titleBox.appendChild(closeButton);

    return titleBox;
  }

  // Update state and re-render
  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.render();
  }

  update(eventInfo, extraInfo) {
    this.eventInfo = eventInfo;
    this.extraInfo = extraInfo;
    // Re-render with updated data
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
