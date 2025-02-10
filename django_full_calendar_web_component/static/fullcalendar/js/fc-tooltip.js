class FCTooltip {
  static TOOLTIP_MARGIN = 4;
  static TOOLTIP_WINDOW_MARGIN = 16;
  static TOOLTIP_INSTANCES = {};

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

  constructor(el, eventInfo) {
    const instanceId = eventInfo._instance.instanceId;

    this.eventElem = el;
    this.eventInfo = eventInfo;

    this.createTooltip();

    this.setupTooltipListeners();

    FCTooltip.TOOLTIP_INSTANCES[instanceId] = this;
  }

  dispose = () => {
    this.eventElem.removeEventListener("mouseenter", this.mouseEnterHandler);
    this.eventElem.removeEventListener("mouseleave", this.mouseLeaveHandler);
    this.tooltip.remove();
    delete FCTooltip.TOOLTIP_INSTANCES[this.eventInfo._instance.instanceId];
  };

  update = () => {
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

  createTooltip = () => {
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
    this.update();
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
