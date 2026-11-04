const fs = require('fs');
const path = require('path');
const vm = require('vm');
const https = require('https');
const assert = require('assert');

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

class MockElement {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase();
    this.style = {};
    this.className = '';
    this.classList = {
      add: (cls) => {
        const classes = new Set(this.className.split(' ').filter(Boolean));
        classes.add(cls);
        this.className = Array.from(classes).join(' ');
      },
      remove: (cls) => {
        const classes = new Set(this.className.split(' ').filter(Boolean));
        classes.delete(cls);
        this.className = Array.from(classes).join(' ');
      },
      contains: (cls) => this.className.split(' ').includes(cls)
    };
    this.children = [];
    this.childNodes = [];
    this.attributes = {};
    this.listeners = {};
  }
  appendChild(child) {
    this.children.push(child);
    this.childNodes.push(child);
    child.parentNode = this;
    return child;
  }
  removeChild(child) {
    this.children = this.children.filter(c => c !== child);
    this.childNodes = this.childNodes.filter(c => c !== child);
    child.parentNode = null;
    return child;
  }
  setAttribute(name, val) { this.attributes[name] = String(val); }
  getAttribute(name) { return this.attributes[name] !== undefined ? this.attributes[name] : null; }
  hasAttribute(name) { return this.attributes[name] !== undefined; }
  removeAttribute(name) { delete this.attributes[name]; }
  addEventListener(evt, cb) {
    if (!this.listeners[evt]) this.listeners[evt] = [];
    this.listeners[evt].push(cb);
  }
  removeEventListener(evt, cb) {
    if (!this.listeners[evt]) return;
    this.listeners[evt] = this.listeners[evt].filter(f => f !== cb);
  }
  dispatchEvent(evt) {
    if (this.listeners[evt.type]) {
      this.listeners[evt.type].forEach(cb => cb(evt));
    }
  }
  querySelector(sel) { return null; }
  querySelectorAll(sel) { return []; }
  getBoundingClientRect() { return { top: 0, left: 0, width: 800, height: 600, bottom: 600, right: 800 }; }
  closest(sel) { return null; }
}

async function runTests() {
  console.log('Downloading FullCalendar v7.1.3 bundles from jsdelivr...');
  const [fcCode, schedulerCode, bs5Code] = await Promise.all([
    fetch('https://cdn.jsdelivr.net/npm/fullcalendar@7.1.3/all/global.js'),
    fetch('https://cdn.jsdelivr.net/npm/fullcalendar-scheduler@7.1.3/all/global.js'),
    fetch('https://cdn.jsdelivr.net/npm/@fullcalendar/bootstrap5@7.1.3/global.js')
  ]);

  const customElementsRegistry = {};
  const mockDocument = {
    createElement: (tag) => new MockElement(tag),
    createTextNode: (txt) => ({ text: txt, nodeType: 3 }),
    createElementNS: (ns, tag) => new MockElement(tag),
    addEventListener: () => {},
    removeEventListener: () => {},
    documentElement: new MockElement('html'),
    body: new MockElement('body'),
    querySelector: () => null,
    querySelectorAll: () => []
  };

  const sandbox = {
    window: {},
    document: mockDocument,
    HTMLElement: MockElement,
    customElements: {
      define: (name, cls) => { customElementsRegistry[name] = cls; },
      get: (name) => customElementsRegistry[name]
    },
    navigator: { userAgent: 'node' },
    console: console,
    setTimeout: (fn) => setTimeout(fn, 0),
    clearTimeout: clearTimeout,
    CustomEvent: class CustomEvent {
      constructor(type, init = {}) {
        this.type = type;
        this.detail = init.detail;
        this.bubbles = init.bubbles;
      }
    },
    Handlebars: {
      registerPartial: () => {},
      compile: () => () => ''
    },
    __FC_LICENSE_KEY: 'CC-Attribution-NonCommercial-NoDerivatives'
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(fcCode, sandbox);
  vm.runInContext(schedulerCode, sandbox);
  vm.runInContext(bs5Code, sandbox);

  // Load project scripts
  const baseDir = path.resolve(__dirname, '..');
  const baseTooltipCode = fs.readFileSync(path.join(baseDir, 'django_full_calendar_web_component/static/fullcalendar/js/base-tooltip.js'), 'utf8');
  const fcTooltipCode = fs.readFileSync(path.join(baseDir, 'django_full_calendar_web_component/static/fullcalendar/js/fc-tooltip.js'), 'utf8');
  const webComponentCode = fs.readFileSync(path.join(baseDir, 'django_full_calendar_web_component/static/fullcalendar/js/web-component.js'), 'utf8');

  vm.runInContext(baseTooltipCode, sandbox);
  vm.runInContext(fcTooltipCode, sandbox);
  vm.runInContext(webComponentCode, sandbox);

  console.log('Testing custom element registration...');
  const CalendarElement = customElementsRegistry['calendar-element'];
  assert(CalendarElement, 'calendar-element should be registered');

  console.log('Testing eventToFCEvent conversion for v7 compatibility...');
  const elementInstance = new CalendarElement();
  elementInstance._proposals = [
    { id: 10, title: 'Proposal 1' },
    { id: 20, title: 'Proposal 2' }
  ];

  const rawEvent = {
    id: 101,
    start: '2026-10-22T09:00:00',
    end: '2026-10-22T11:00:00',
    instrument: 5,
    proposal: 10,
    type: 'experiment',
    title: 'Testing v7 Event',
    executed_remotely: true,
    extra_experimental_hours: 2,
    sample_preparation_hours: 1,
    data_analysis_hours: 3,
    note: 'Test note'
  };

  const fcEvent = elementInstance.eventToFCEvent(rawEvent);

  // Check v7 properties
  assert.strictEqual(fcEvent.id, '101');
  assert.strictEqual(fcEvent.resourceId, '5');
  assert.strictEqual(typeof fcEvent.className, 'string', 'className must be string in v7');
  assert(fcEvent.className.includes('fc-event-clickable'));
  assert(fcEvent.className.includes('event--remote'));
  assert(fcEvent.className.includes('event--type-experiment'));

  // Color properties
  assert(fcEvent.color, 'fcEvent.color must be set in v7');
  assert.strictEqual(fcEvent.color, fcEvent.backgroundColor, 'color and backgroundColor should match');

  // Extended props
  assert.strictEqual(fcEvent.extendedProps.extra_experimental_hours, 2);
  assert.strictEqual(fcEvent.extendedProps.sample_preparation_hours, 1);
  assert.strictEqual(fcEvent.extendedProps.data_analysis_hours, 3);
  assert.strictEqual(fcEvent.extendedProps.note, 'Test note');
  assert.strictEqual(fcEvent.extendedProps.executedRemotely, true);

  console.log('Testing getFullCalendarOptions() for v7 settings...');
  elementInstance._options = {
    initialView: 'resourceTimeGridWeek',
    slotDuration: '01:00:00',
    hasChangePermission: true,
    views: {}
  };

  const options = elementInstance.getFullCalendarOptions();
  assert.strictEqual(options.themeSystem, undefined, 'themeSystem should not be present in v7');
  assert.strictEqual(options.resourceColumnsWidth, '200px');
  assert.strictEqual(options.resourceColumnHeaderContent, 'Instruments');
  assert.strictEqual(options.schedulerLicenseKey, 'CC-Attribution-NonCommercial-NoDerivatives');
  assert.strictEqual(options.editable, true);

  console.log('Testing FCTooltip color fallback...');
  const mockEventInfo = {
    id: '101',
    _instance: { instanceId: 'inst-101' },
    title: 'Test',
    color: '#009688',
    backgroundColor: undefined,
    start: new Date(),
    end: new Date(),
    extendedProps: {}
  };
  sandbox.mockEventInfo = mockEventInfo;
  const tooltipInstance = vm.runInContext('FCTooltip.getInstance(mockEventInfo)', sandbox);
  assert.strictEqual(tooltipInstance, null, 'Should return null when not registered');

  console.log('All JavaScript v7 compatibility checks passed successfully!');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
