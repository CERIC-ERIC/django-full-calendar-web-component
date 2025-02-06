class FCTooltip {
  static TOOLTIP_MARGIN = 4;
  static TOOLTIP_WINDOW_MARGIN = 16;
  static DATE_FORMAT = {
    month: "numeric",
    year: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };

  static instances = {};

  eventElem = null;
  eventInfo = null;
  tooltip = null;

  constructor(el, eventInfo) {
    const instanceId = eventInfo._instance.instanceId;
    if (FCTooltip.instances[instanceId]) {
      throw new Error("Tooltip already exists for this event");
    }

    this.eventElem = el;
    this.eventInfo = eventInfo;
    this.tooltip = this.createTooltip();

    this.setupTooltipListeners();

    FCTooltip.instances[instanceId] = this;
  }

  createTooltip = () => {
    const tooltip = document.createElement("div");
    tooltip.className = "fc-tooltip";

    // title
    const titleBox = document.createElement("div");
    titleBox.className = "fc-tooltip__title-box";

    const colorDot = document.createElement("i");
    colorDot.className = "fc-daygrid-event-dot";
    colorDot.style.borderColor = this.eventInfo.backgroundColor;
    titleBox.append(colorDot);

    const title = document.createElement("span");
    title.textContent = this.eventInfo.title;
    titleBox.appendChild(title);

    tooltip.appendChild(titleBox);

    // tooltip body
    const body = document.createElement("div");
    body.className = "fc-tooltip__body";

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

    body.innerHTML = `
      <b>Type:</b> ${eventType}<br>
      ${eventProposal ? `<b>Proposal:</b> ${eventProposal}<br>` : ""}
      ${eventInstrument ? `<b>Instrument:</b> ${eventInstrument}<br>` : ""}
      <b>From:</b> ${startDate}<br>
      <b>To:</b> ${endDate}
    `;
    tooltip.appendChild(body);

    document.body.appendChild(tooltip);

    return tooltip;
  };

  setupTooltipListeners = () => {
    this.eventElem.addEventListener("mouseenter", this.mouseEnterHandler);
    this.eventElem.addEventListener("mouseleave", this.mouseLeaveHandler);
  };

  getTooltipPosition = (event) => {
    const rect = this.eventElem.getBoundingClientRect();

    const posX = Math.round(event.clientX - this.tooltip.offsetWidth / 2);
    const posY = rect.top + rect.height + FCTooltip.TOOLTIP_MARGIN;

    // keep the tooltip inside the window with 10px margin
    const fixedPosX = Math.min(
      Math.max(10, posX),
      window.innerWidth -
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
        rect.top -
        this.tooltip.offsetHeight +
        window.scrollY -
        FCTooltip.TOOLTIP_MARGIN;
    }

    return { x: fixedPosX, y: fixedPosY };
  };

  mouseEnterHandler = (event) => {
    // if mouse is down return
    if (event.buttons > 0) {
      return;
    }

    const tooltipPosition = this.getTooltipPosition(event);
    this.tooltip.style.left = `${tooltipPosition.x}px`;
    this.tooltip.style.top = `${tooltipPosition.y}px`;
    this.tooltip.classList.add("fc-tooltip--show");
  };

  mouseLeaveHandler = () => {
    this.tooltip.classList.remove("fc-tooltip--show");
  };
}
