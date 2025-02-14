class FCTooltip {
  static TOOLTIP_MARGIN = 4;
  static TOOLTIP_WINDOW_MARGIN = 16;
  static TOOLTIP_INSTANCES = {};
  static TRANSITION_DURATION = 100; // ms

  static DATE_FORMAT = {
    month: "numeric",
    year: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };

  eventElem = null;
  eventInfo = null;
  tooltip = null;

  static getInstace = (eventInfo) => {
    const instanceId = eventInfo._instance.instanceId;

    if (FCTooltip.TOOLTIP_INSTANCES[instanceId]) {
      return FCTooltip.TOOLTIP_INSTANCES[instanceId];
    } else {
      return null;
    }
  };

  static disposeAll = () => {
    Object.values(FCTooltip.TOOLTIP_INSTANCES).forEach((tooltip) =>
      tooltip.dispose()
    );
  };

  constructor(el, eventInfo) {
    const instanceId = eventInfo._instance.instanceId;

    this.eventElem = el;

    this.createTooltip(eventInfo);

    this.setupTooltipListeners();

    FCTooltip.TOOLTIP_INSTANCES[instanceId] = this;
  }

  dispose = () => {
    this.eventElem.removeEventListener("mouseenter", this.handleEventClick);
    this.eventElem.removeEventListener("mouseleave", this.handleClickOutside);
    this.tooltip.remove();
    delete FCTooltip.TOOLTIP_INSTANCES[this.eventInfo._instance.instanceId];
  };

  update = (eventInfo) => {
    this.eventInfo = eventInfo;
    // Get tooltip elements
    const titleBox = this.tooltip.querySelector(".fc-tooltip__title-box");
    const colorDot = titleBox.querySelector(".fc-daygrid-event-dot");
    const title = titleBox.querySelector("span");
    const body = this.tooltip.querySelector(".fc-tooltip__body");

    // Prepare tooltip content
    const eventType = this.eventInfo.extendedProps.type;
    const eventProposal = this.eventInfo.extendedProps.proposal;
    const eventInstrument = this.eventInfo.extendedProps.instrument;

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
      ${eventProposal ? `<b>Proposal:</b> ${eventProposal}<br>` : ""}
      ${eventInstrument ? `<b>Instrument:</b> ${eventInstrument}<br>` : ""}
      <b>From:</b> ${startDate}<br>
      <b>To:</b> ${endDate}
    `;
  };

  createTooltip = (eventInfo) => {
    const tooltip = document.createElement("div");
    tooltip.className = "fc-tooltip";

    const titleBox = document.createElement("div");
    titleBox.className = "fc-tooltip__title-box";

    const colorDot = document.createElement("i");
    colorDot.className = "fc-daygrid-event-dot";
    titleBox.append(colorDot);

    const title = document.createElement("span");
    titleBox.appendChild(title);

    tooltip.appendChild(titleBox);

    // tooltip body
    const body = document.createElement("div");
    body.className = "fc-tooltip__body";
    tooltip.appendChild(body);

    document.body.appendChild(tooltip);

    this.tooltip = tooltip;

    // First update
    this.update(eventInfo);
  };

  setupTooltipListeners = () => {
    this.eventElem.addEventListener("click", this.handleEventClick);
  };

  getTooltipPosition = (event) => {
    // position the tooltip relative to the sticky title
    const eventTitle = this.eventElem.querySelector(".fc-sticky");

    const rect = eventTitle.getBoundingClientRect();

    const posX =
      rect.left -
      this.tooltip.offsetWidth -
      FCTooltip.TOOLTIP_MARGIN +
      window.scrollX;
    const posY =
      rect.top +
      rect.height / 2 -
      this.tooltip.offsetHeight / 2 +
      window.scrollY;

    // keep the tooltip inside the window with 10px margin
    const fixedPosX = Math.min(
      Math.max(10 + window.scrollX, posX),
      window.innerWidth +
        window.scrollX -
        this.tooltip.offsetWidth / 2 -
        FCTooltip.TOOLTIP_WINDOW_MARGIN
    );

    let fixedPosY = posY;
    // Check if the tooltip will go out of the window at the bottom
    if (
      posY + this.tooltip.offsetHeight + FCTooltip.TOOLTIP_WINDOW_MARGIN >
      window.innerHeight + window.scrollY
    ) {
      fixedPosY =
        window.scrollY +
        window.innerHeight -
        this.tooltip.offsetHeight -
        FCTooltip.TOOLTIP_WINDOW_MARGIN;
    }

    // Check if the tooltip will go out of the window at the top

    if (posY < window.scrollY + FCTooltip.TOOLTIP_WINDOW_MARGIN) {
      fixedPosY = window.scrollY + FCTooltip.TOOLTIP_WINDOW_MARGIN;
    }

    return { x: fixedPosX, y: fixedPosY };
  };

  showTooltip = (posX, posY) => {
    this.tooltip.style.left = `${posX}px`;
    this.tooltip.style.top = `${posY}px`;
    this.tooltip.classList.add("fc-tooltip--show");
  };

  hideTooltip = () => {
    this.tooltip.classList.remove("fc-tooltip--show");
    this.removeListeners();
    window.setTimeout(() => {
      this.tooltip.removeAttribute("style");
    }, FCTooltip.TRANSITION_DURATION);
  };

  handleEventClick = (event) => {
    const tooltipPosition = this.getTooltipPosition(event);
    this.showTooltip(tooltipPosition.x, tooltipPosition.y);

    // prevent add duplicate listeners
    this.removeListeners();

    // Hide tooltip when clicking outside
    document.addEventListener("mousedown", this.handleClickOutside);
    // Hide tooltip when scrolling
    window.addEventListener("scroll", this.handleScroll, true);
    // Hide tooltip when resizing
    window.addEventListener("resize", this.handleResize, true);
  };

  handleClickOutside = (event) => {
    if (!this.tooltip.contains(event.target)) {
      this.hideTooltip();
    } else {
      event.stopPropagation();
    }
  };

  handleScroll = () => {
    this.hideTooltip();
  };

  handleResize = () => {
    this.hideTooltip();
  };

  removeListeners = () => {
    document.removeEventListener("mousedown", this.handleClickOutside);
    window.removeEventListener("scroll", this.handleScroll, true);
    window.removeEventListener("resize", this.handleResize, true);
  };
}
