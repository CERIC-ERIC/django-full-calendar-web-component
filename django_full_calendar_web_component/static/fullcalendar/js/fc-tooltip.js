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

  constructor(el, eventInfo, extraInfo, actions) {
    super(el);
    this.eventInfo = eventInfo;
    this.createTooltip(eventInfo, extraInfo, actions);
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

  createTooltip(eventInfo, extraInfo, actions) {
    const tooltip = document.createElement("div");
    tooltip.className = "fc-tooltip";

    // tooltip header
    const titleBox = document.createElement("div");
    titleBox.className = "fc-tooltip__title-box";

    const colorDot = document.createElement("i");
    colorDot.className = "fc-daygrid-event-dot";
    titleBox.append(colorDot);

    const title = document.createElement("span");
    title.className = "fc-tooltip__title";
    titleBox.appendChild(title);
    tooltip.appendChild(titleBox);

    // actions
    actions.forEach((action) => {
      const actionButton = document.createElement("button");
      actionButton.title = action.label;
      actionButton.className = "fc-tooltip__action-button";
      actionButton.innerHTML = `<i class='fas fa-${action.icon}'></i>`;
      actionButton.addEventListener("click", () => {
        action.callback(eventInfo);
      });
      titleBox.appendChild(actionButton);
    });

    const closeButton = document.createElement("button");
    closeButton.title = "Close";
    closeButton.className = "fc-tooltip__action-button";
    closeButton.innerHTML = "<i class='btn-close'></i>";
    closeButton.addEventListener("click", () => {
      this.hideTooltip();
    });

    titleBox.appendChild(closeButton);

    // tooltip body
    const body = document.createElement("div");
    body.className = "fc-tooltip__body";
    tooltip.appendChild(body);

    document.body.appendChild(tooltip);

    this.tooltip = tooltip;

    // First update
    this.update(eventInfo, extraInfo);
  }

  update(eventInfo, extraInfo) {
    this.eventInfo = eventInfo;
    // Get tooltip elements
    const titleBox = this.tooltip.querySelector(".fc-tooltip__title-box");
    const colorDot = titleBox.querySelector(".fc-daygrid-event-dot");
    const title = titleBox.querySelector("span");
    const body = this.tooltip.querySelector(".fc-tooltip__body");

    // Prepare tooltip content
    const eventType = extraInfo.type;
    const eventProposal = extraInfo.proposal;
    const eventInstrument = extraInfo.instrument;

    const startDate = FullCalendar.formatDate(
      this.eventInfo.start,
      FCTooltip.DATE_FORMAT
    );

    const endDate = FullCalendar.formatDate(
      this.eventInfo.end,
      FCTooltip.DATE_FORMAT
    );

    // Update tooltip content
    colorDot.style.borderColor = this.eventInfo.backgroundColor;
    title.textContent = this.eventInfo.title;
    body.innerHTML = `
      <b>Type:</b> ${eventType}<br>
      ${
        eventProposal
          ? `<b>Proposal:</b> ${
              eventProposal.url
                ? `<a href="${eventProposal.url}">${eventProposal.title}</a>`
                : eventProposal.title
            }<br>`
          : ""
      }
      ${
        eventInstrument
          ? `<b>Instrument:</b> ${
              eventInstrument.url
                ? `<a href="${eventInstrument.url}">${eventInstrument.title}</a>`
                : eventInstrument.title
            }<br>`
          : ""
      }
      <b>From:</b> ${startDate}<br>
      <b>To:</b> ${endDate}
    `;
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
