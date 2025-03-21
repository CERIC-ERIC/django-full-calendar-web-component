class BaseTooltip {
  static TOOLTIP_MARGIN = 4;
  static TOOLTIP_WINDOW_MARGIN = 16;
  static TRANSITION_DURATION = 100; // ms

  tooltip = null;
  eventElem = null;

  constructor(el) {
    this.eventElem = el;
  }

  getTooltipPosition() {
    // Position the tooltip relative to the title (sticky) if it has one
    const eventTitle =
      this.eventElem.querySelector(".fc-sticky") || this.eventElem;
    const rect = eventTitle.getBoundingClientRect();

    const posX =
      rect.left -
      this.tooltip.offsetWidth -
      BaseTooltip.TOOLTIP_MARGIN +
      window.scrollX;
    const posY =
      rect.top +
      rect.height / 2 -
      this.tooltip.offsetHeight / 2 +
      window.scrollY;

    // Ensure the tooltip stays within the window
    const fixedPosX = Math.min(
      Math.max(10 + window.scrollX, posX),
      window.innerWidth +
        window.scrollX -
        this.tooltip.offsetWidth / 2 -
        BaseTooltip.TOOLTIP_WINDOW_MARGIN
    );

    let fixedPosY = posY;
    if (
      posY + this.tooltip.offsetHeight + BaseTooltip.TOOLTIP_WINDOW_MARGIN >
      window.innerHeight + window.scrollY
    ) {
      fixedPosY =
        window.scrollY +
        window.innerHeight -
        this.tooltip.offsetHeight -
        BaseTooltip.TOOLTIP_WINDOW_MARGIN;
    }
    if (posY < window.scrollY + BaseTooltip.TOOLTIP_WINDOW_MARGIN) {
      fixedPosY = window.scrollY + BaseTooltip.TOOLTIP_WINDOW_MARGIN;
    }

    return { x: fixedPosX, y: fixedPosY };
  }

  showTooltip(posX, posY) {
    this.tooltip.style.left = `${posX}px`;
    this.tooltip.style.top = `${posY}px`;
    this.tooltip.classList.add("fc-tooltip--show");
  }

  hideTooltip() {
    this.tooltip.classList.remove("fc-tooltip--show");
    this.removeListeners();
    window.setTimeout(() => {
      this.tooltip.removeAttribute("style");
    }, BaseTooltip.TRANSITION_DURATION);
  }

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

  removeListeners() {
    document.removeEventListener("mousedown", this.handleClickOutside);
    window.removeEventListener("scroll", this.handleScroll, true);
    window.removeEventListener("resize", this.handleResize, true);
  }

  handleEventClick = (event) => {
    const tooltipPosition = this.getTooltipPosition();
    this.showTooltip(tooltipPosition.x, tooltipPosition.y);

    // Prevent duplicate listeners
    this.removeListeners();
    document.addEventListener("mousedown", this.handleClickOutside);
    window.addEventListener("scroll", this.handleScroll, true);
    window.addEventListener("resize", this.handleResize, true);
  };
}
