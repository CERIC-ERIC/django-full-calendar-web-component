class CalendarElement extends FullCalendarElement {
  constructor() {
    super(...arguments);
  }

  connectedCallback() {
    this._handleOptionsStr(this.getAttribute("options"));
  }

  _optionsToFullCalendar(options) {
    // TODO: do the real conversion
    console.log("options", options);

    // Add the Non-Commercial license key
    options.schedulerLicenseKey = "CC-Attribution-NonCommercial-NoDerivatives";
    return options;
  }

  _handleOptions(options) {
    const fullCalendarOptions = this._optionsToFullCalendar(options);
    return super._handleOptions(fullCalendarOptions);
  }
}

customElements.define("calendar-element", CalendarElement);
