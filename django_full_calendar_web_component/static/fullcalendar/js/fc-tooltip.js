class FCTooltip {
  static TOOLTIP_MARGIN = 4;
  static TOOLTIP_WINDOW_MARGIN = 16;

  eventElem = null;
  eventInfo = null;
  tooltip = null;

  constructor(el, eventInfo) {
    this.eventElem = el;
    this.eventInfo = eventInfo;
    this.tooltip = this.createTooltip();

    this.setupTooltipListeners();
  }

  createTooltip() {
    const tooltip = document.createElement("div");
    tooltip.className = "fc-tooltip";
    const title = document.createElement("span");
    title.className = "title";
    title.textContent = this.eventInfo.title;
    tooltip.appendChild(title);

    document.body.appendChild(tooltip);

    return tooltip;
  }

  setupTooltipListeners() {
    this.eventElem.addEventListener(
      "mouseenter",
      this.mouseEnterHandler.bind(this)
    );
    this.eventElem.addEventListener(
      "mouseleave",
      this.mouseLeaveHandler.bind(this)
    );
  }

  getTooltipPosition(event) {
    const rect = this.eventElem.getBoundingClientRect();

    const posX = event.clientX;
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
  }

  mouseEnterHandler(event) {
    const tooltipPosition = this.getTooltipPosition(event);
    this.tooltip.style.left = `${tooltipPosition.x}px`;
    this.tooltip.style.top = `${tooltipPosition.y}px`;
    this.tooltip.classList.add("show");
  }

  mouseLeaveHandler() {
    this.tooltip.classList.remove("show");
  }
}
