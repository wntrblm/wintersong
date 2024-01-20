var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp(target, key, result);
  return result;
};

// src/base/livereload.ts
if (DEBUG) {
  new EventSource("/esbuild").addEventListener(
    "change",
    () => location.reload()
  );
}

// src/teeth.ts
var teeth_exports = {};
__export(teeth_exports, {
  default: () => Teeth
});
var Teeth = class {
  static {
    __name(this, "Teeth");
  }
  static encodedLength(src_len) {
    if (src_len instanceof Uint8Array) {
      src_len = src_len.length;
    }
    return Math.floor((src_len + 4 - 1) / 4) * 5;
  }
  static encode(src) {
    const src_len = src.length;
    let dst = new Uint8Array(this.encodedLength(src_len));
    let src_idx = 0;
    let dst_idx = 0;
    while (src_idx < src_len) {
      if (src_idx + 4 <= src_len) {
        dst[dst_idx] = 64 | (src[src_idx] & 128) >> 4 | (src[src_idx + 1] & 128) >> 5 | (src[src_idx + 2] & 128) >> 6 | (src[src_idx + 3] & 128) >> 7;
        dst[dst_idx + 1] = src[src_idx] & 127;
        dst[dst_idx + 2] = src[src_idx + 1] & 127;
        dst[dst_idx + 3] = src[src_idx + 2] & 127;
        dst[dst_idx + 4] = src[src_idx + 3] & 127;
        dst_idx += 5;
        src_idx += 4;
      } else if (src_idx + 3 == src_len) {
        dst[dst_idx] = 48 | (src[src_idx] & 128) >> 4 | (src[src_idx + 1] & 128) >> 5 | (src[src_idx + 2] & 128) >> 6;
        dst[dst_idx + 1] = src[src_idx] & 127;
        dst[dst_idx + 2] = src[src_idx + 1] & 127;
        dst[dst_idx + 3] = src[src_idx + 2] & 127;
        dst_idx += 4;
        src_idx += 3;
      } else if (src_idx + 2 == src_len) {
        dst[dst_idx] = 32 | (src[src_idx] & 128) >> 4 | (src[src_idx + 1] & 128) >> 5;
        dst[dst_idx + 1] = src[src_idx] & 127;
        dst[dst_idx + 2] = src[src_idx + 1] & 127;
        dst_idx += 3;
        src_idx += 2;
      } else if (src_idx + 1 == src_len) {
        dst[dst_idx] = 16 | (src[src_idx] & 128) >> 4;
        dst[dst_idx + 1] = src[src_idx] & 127;
        dst_idx += 2;
        src_idx += 1;
      } else {
        break;
      }
    }
    return dst;
  }
  static decode(src) {
    const src_len = src.length;
    const dst_len = src_len / 5 * 4;
    let dst = new Uint8Array(dst_len);
    let src_idx = 0;
    let dst_idx = 0;
    while (src_idx < src_len) {
      dst[dst_idx] = (src[src_idx] & 8) << 4 | src[src_idx + 1];
      dst[dst_idx + 1] = (src[src_idx] & 4) << 5 | src[src_idx + 2];
      dst[dst_idx + 2] = (src[src_idx] & 2) << 6 | src[src_idx + 3];
      dst[dst_idx + 3] = (src[src_idx] & 1) << 7 | src[src_idx + 4];
      let len_marker = src[src_idx] >> 4;
      dst_idx += len_marker;
      src_idx += 5;
    }
    return dst.slice(0, dst_idx);
  }
};

// src/base/web-components/context.ts
var ContextRequestEvent = class _ContextRequestEvent extends Event {
  constructor(context_name, _callback) {
    super(_ContextRequestEvent.type, {
      bubbles: true,
      cancelable: true,
      composed: true
    });
    this.context_name = context_name;
    this._callback = _callback;
  }
  static {
    __name(this, "ContextRequestEvent");
  }
  static {
    this.type = "context-request";
  }
  callback(context) {
    this.stopPropagation();
    this._callback(context);
  }
};

// src/base/types.ts
function isPrimitive(value) {
  return value === null || typeof value != "object" && typeof value != "function";
}
__name(isPrimitive, "isPrimitive");
function isNumber(value) {
  return typeof value === "number" && !isNaN(value);
}
__name(isNumber, "isNumber");
function isIterable(value) {
  return Array.isArray(value) || typeof value?.[Symbol.iterator] === "function";
}
__name(isIterable, "isIterable");
function isArray(value) {
  return Array.isArray(value);
}
__name(isArray, "isArray");

// src/base/web-components/css.ts
var stylesheet_cache = /* @__PURE__ */ new Map();
var CSS = class {
  constructor(css_string) {
    this.css_string = css_string;
  }
  static {
    __name(this, "CSS");
  }
  get stylesheet() {
    let sheet = stylesheet_cache.get(this.css_string);
    if (sheet == void 0) {
      sheet = new CSSStyleSheet();
      sheet.replaceSync(this.css_string);
      stylesheet_cache.set(this.css_string, sheet);
    }
    return sheet;
  }
};
function css(strings, ...values) {
  let text = "";
  for (let i = 0; i < strings.length - 1; i++) {
    text += strings[i];
    const value = values[i];
    if (value instanceof CSS) {
      text += value.css_string;
    } else if (isNumber(value)) {
      text += String(value);
    } else {
      throw new Error(
        "Only CSS or number variables allowed in css template literal"
      );
    }
  }
  text += strings.at(-1);
  return new CSS(text);
}
__name(css, "css");
function adoptStyles(root, styles) {
  root.adoptedStyleSheets = root.adoptedStyleSheets.concat(
    styles.map((ss) => ss instanceof CSSStyleSheet ? ss : ss.stylesheet)
  );
}
__name(adoptStyles, "adoptStyles");

// src/base/array.ts
function asArray(x) {
  if (isArray(x)) {
    return x;
  }
  return [x];
}
__name(asArray, "asArray");
var collator = new Intl.Collator(void 0, { numeric: true });

// src/base/async.ts
var DeferredPromise = class {
  static {
    __name(this, "DeferredPromise");
  }
  #promise;
  #resolve;
  #reject;
  #outcome;
  #value;
  constructor() {
    this.#promise = new Promise((resolve, reject) => {
      this.#resolve = resolve;
      this.#reject = reject;
    });
  }
  get rejected() {
    return this.#outcome === 1 /* Rejected */;
  }
  get resolved() {
    return this.#outcome === 0 /* Resolved */;
  }
  get settled() {
    return !!this.#outcome;
  }
  get value() {
    return this.#value;
  }
  then(onfulfilled, onrejected) {
    return this.#promise.then(onfulfilled, onrejected);
  }
  resolve(value) {
    this.#outcome = 0 /* Resolved */;
    this.#value = value;
    this.#resolve(value);
  }
  reject(error) {
    this.#outcome = 1 /* Rejected */;
    this.#value = error;
    this.#reject(error);
  }
};

// src/base/web-components/html.ts
function isHTMLElement(v) {
  return typeof HTMLElement === "object" && v instanceof HTMLElement;
}
__name(isHTMLElement, "isHTMLElement");
function html(strings, ...values) {
  const template = document.createElement(`template`);
  template.innerHTML = prepare_template_html(strings, values);
  let content = template.content;
  content = document.importNode(content, true);
  apply_values_to_tree(content, values);
  if (content.childElementCount == 1) {
    return content.firstElementChild;
  } else {
    return content;
  }
}
__name(html, "html");
var Literal = class {
  constructor(text) {
    this.text = text;
  }
  static {
    __name(this, "Literal");
  }
};
var placeholder_regex = /\$\$:(\d+):\$\$/g;
function prepare_template_html(strings, values) {
  const template_parts = [];
  for (let i = 0; i < strings.length - 1; i++) {
    template_parts.push(strings[i]);
    if (values[i] instanceof Literal) {
      template_parts.push(values[i].text);
    } else {
      template_parts.push(`$$:${i}:$$`);
    }
  }
  template_parts.push(strings[strings.length - 1]);
  const template_string = template_parts.join("");
  return template_string;
}
__name(prepare_template_html, "prepare_template_html");
function apply_values_to_tree(tree, values) {
  const walker = document.createTreeWalker(
    tree,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
    null
  );
  let node;
  while ((node = walker.nextNode()) !== null) {
    if (node.nodeType == Node.TEXT_NODE) {
      apply_content_value(node.parentNode, node, values);
    } else if (node.nodeType == Node.ELEMENT_NODE) {
      const elm = node;
      for (const attr_name of elm.getAttributeNames()) {
        const attr = elm.getAttributeNode(attr_name);
        apply_attribute_value(elm, attr, values);
      }
    }
  }
}
__name(apply_values_to_tree, "apply_values_to_tree");
function apply_content_value(node, text, values) {
  if (!node) {
    return;
  }
  const parts = text.data.split(placeholder_regex);
  if (!parts || parts.length == 1) {
    return;
  }
  if (isHTMLElement(node) && ["script", "style"].includes(node.localName)) {
    throw new Error(
      `Cannot bind values inside of <script> or <style> tags`
    );
  }
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) {
      continue;
    }
    if (i % 2 == 0) {
      node.insertBefore(new Text(part), text);
    } else {
      for (const value of convert_value_for_content(
        values[parseInt(part, 10)]
      )) {
        if (value == null)
          continue;
        node.insertBefore(value, text);
      }
    }
  }
  text.data = "";
}
__name(apply_content_value, "apply_content_value");
function apply_attribute_value(elm, attr, values) {
  const parts = attr.value.split(placeholder_regex);
  if (!parts || parts.length == 1) {
    return;
  }
  if (attr.localName.startsWith("on")) {
    throw new Error(`Cannot bind to event handler ${attr.localName}.`);
  }
  if (parts.length == 3 && parts[0] == "" && parts[2] == "") {
    const value = values[parseInt(parts[1], 10)];
    if (value === true) {
      attr.value = "";
    } else if (value === false || value === null || value === void 0) {
      elm.removeAttribute(attr.name);
    } else {
      attr.value = convert_value_for_attr(value, attr.name);
    }
    return;
  }
  attr.value = attr.value.replaceAll(
    placeholder_regex,
    (_, number) => {
      const value = values[parseInt(number, 10)];
      return convert_value_for_attr(value, attr.localName);
    }
  );
}
__name(apply_attribute_value, "apply_attribute_value");
function* convert_value_for_content(value) {
  if (value == null || value == void 0) {
    return;
  }
  if (isPrimitive(value)) {
    yield new Text(value.toString());
    return;
  }
  if (value instanceof Node || value instanceof DocumentFragment) {
    yield value;
    return;
  }
  if (isIterable(value)) {
    for (const i of value) {
      yield* convert_value_for_content(i);
    }
    return;
  }
  throw new Error(`Invalid value ${value}`);
}
__name(convert_value_for_content, "convert_value_for_content");
function convert_value_for_attr(value, attr_name) {
  if (value == null || value == void 0) {
    return "";
  }
  if (isPrimitive(value)) {
    return value.toString();
  }
  if (isIterable(value)) {
    return Array.from(value).map((v) => convert_value_for_attr(v, attr_name)).join("");
  }
  throw new Error(`Invalid value ${value}`);
}
__name(convert_value_for_attr, "convert_value_for_attr");

// src/base/web-components/custom-element.ts
var CustomElement = class extends HTMLElement {
  constructor() {
    super();
    this.updateComplete = new DeferredPromise();
    const static_this = this.constructor;
    if (static_this.exportparts.length) {
      this.setAttribute("exportparts", static_this.exportparts.join(","));
    }
  }
  static {
    __name(this, "CustomElement");
  }
  static {
    /**
     * If true, a shadowRoot is created for this element.
     */
    this.useShadowRoot = true;
  }
  static {
    /**
     * Exports nested shadow dom parts
     * https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/exportparts
     */
    this.exportparts = [];
  }
  /**
   * Returns either the shadowRoot or this if useShadowRoot is false.
   */
  get renderRoot() {
    return this.shadowRoot ?? this;
  }
  /**
   * Called when connected to the DOM
   *
   * By default it calls render() to place the initial content to the
   * renderRoot.
   */
  connectedCallback() {
    this.#renderInitialContent();
  }
  disconnectedCallback() {
  }
  /**
   * Called after the initial content is added to the renderRoot, perfect
   * for registering event callbacks.
   */
  initialContentCallback() {
  }
  /**
   * Called to render content to the renderRoot.
   */
  render() {
    return html``;
  }
  renderedCallback() {
  }
  async update() {
    this.updateComplete = new DeferredPromise();
    while (this.renderRoot.firstChild) {
      this.renderRoot.firstChild.remove();
    }
    this.renderRoot.appendChild(await this.render());
    this.renderedCallback();
    window.requestAnimationFrame(() => {
      this.updateComplete.resolve(true);
    });
    return this.updateComplete;
  }
  #renderInitialContent() {
    const static_this = this.constructor;
    this.updateComplete = new DeferredPromise();
    if (this.constructor.useShadowRoot) {
      this.attachShadow({ mode: "open" });
    }
    if (static_this.styles) {
      adoptStyles(
        this.shadowRoot ?? document,
        asArray(static_this.styles)
      );
    }
    (async () => {
      const content = this.render();
      this.renderRoot.appendChild(content);
      this.renderedCallback();
      this.initialContentCallback();
      window.requestAnimationFrame(() => {
        this.updateComplete.resolve(true);
      });
    })();
    return this.updateComplete;
  }
  queryAssignedElements(selector, slotName) {
    const slot_element = this.renderRoot.querySelector(
      `slot${slotName ? `[name=${slotName}]` : ":not([name])"}`
    );
    const elements = slot_element?.assignedElements() ?? [];
    if (selector) {
      return elements.filter((elm) => elm.matches(selector));
    } else {
      return elements;
    }
  }
};

// src/base/functions.ts
function noop() {
}
__name(noop, "noop");
function preventConcurrentCalls(target) {
  let isRunning = false;
  return (...args) => {
    if (isRunning) {
      return;
    }
    try {
      isRunning = true;
      return target(...args);
    } finally {
      isRunning = false;
    }
  };
}
__name(preventConcurrentCalls, "preventConcurrentCalls");

// src/base/strings.ts
function camelToDash(str) {
  return str.replace(/(^[A-Z])/, ([first]) => first.toLowerCase()).replace(/([A-Z])/g, ([letter]) => `-${letter.toLowerCase()}`);
}
__name(camelToDash, "camelToDash");

// src/base/web-components/decorators.ts
function attribute(options) {
  const to = options.converter?.toAttribute ?? defaultAttributeConverter.toAttribute;
  const from = options.converter?.fromAttribute ?? defaultAttributeConverter.fromAttribute;
  const wrappedOnChange = preventConcurrentCalls(options.onChange ?? noop);
  return (target, propertyKey) => {
    const attributeKey = camelToDash(propertyKey);
    Object.defineProperty(target, propertyKey, {
      enumerable: true,
      configurable: true,
      get() {
        return from(this.getAttribute(attributeKey), options.type);
      },
      set(value) {
        const old = this[propertyKey];
        const converted = to(value, options.type);
        if (converted === null) {
          this.removeAttribute(attributeKey);
        } else {
          this.setAttribute(attributeKey, converted);
        }
        wrappedOnChange(old, value);
      }
    });
  };
}
__name(attribute, "attribute");
var defaultAttributeConverter = {
  toAttribute(value, type) {
    if (value === null) {
      return value;
    }
    switch (type) {
      case Boolean:
        return value ? "" : null;
      case String:
        return value;
      case Number:
        return `${value}`;
      default:
        throw new Error(
          `Can not convert type "${type}" and value "${value} to attribute`
        );
    }
  },
  fromAttribute(value, type) {
    switch (type) {
      case Boolean:
        return value !== null;
      case String:
        return value;
      case Number:
        return value === null ? null : Number(value);
      default:
        throw new Error(
          `Can not convert type "${type}" and value "${value} to attribute`
        );
    }
  }
};

// src/audio/context-manager.ts
var FFT_SIZE = 1024;
var HAS_AUDIO_CONTEXT = window.AudioContext !== void 0;
var AudioContextManager = class {
  static {
    __name(this, "AudioContextManager");
  }
  constructor() {
    if (HAS_AUDIO_CONTEXT) {
      this.createContext();
    }
  }
  static get instance() {
    if (!this._instance) {
      this._instance = new this();
    }
    return this._instance;
  }
  createContext() {
    this.context = new window.AudioContext();
    this.analyser = this.context.createAnalyser();
    this.analyser.smoothingTimeConstant = 1;
    this.analyser.fftSize = FFT_SIZE;
    this.analyser.connect(this.context.destination);
    this.fftData = new Uint8Array(this.analyser.fftSize);
    this.activeSource = void 0;
  }
  checkContext() {
    if (!this.context) {
      throw new Error("Audio context unavailable");
    }
  }
  createSource(mediaElement) {
    this.checkContext();
    return this.context.createMediaElementSource(mediaElement);
  }
  get activeSource() {
    return this._activeSource;
  }
  set activeSource(src) {
    this.checkContext();
    if (this.activeSource) {
      this.activeSource.disconnect();
    }
    this._activeSource = src;
    if (this._activeSource) {
      this._activeSource.connect(this.analyser);
      this.context.resume();
    }
  }
  get analyzerData() {
    this.analyser.getByteTimeDomainData(this.fftData);
    return this.fftData;
  }
};

// src/base/media-queries.ts
var prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
);

// src/audio/oscilloscope.ts
var WinterAudioOscilloscopeElement = class extends CustomElement {
  static {
    __name(this, "WinterAudioOscilloscopeElement");
  }
  static {
    this.styles = [
      css`
            :host {
                display: block;
                width: 100%;
                aspect-ratio: 4 / 1;
            }

            canvas {
                width: 100%;
                height: 100%;
            }
        `
    ];
  }
  start() {
    this.scope.start();
  }
  stop() {
    this.scope.stop();
  }
  render() {
    const width = Math.floor(400 * window.devicePixelRatio);
    const height = Math.floor(100 * window.devicePixelRatio);
    const computedStyles = window.getComputedStyle(this);
    this.canvas = html`<canvas
            width="${width}"
            height="${height}"></canvas>`;
    console.log(computedStyles.backgroundColor);
    this.ctx = this.canvas.getContext("2d", { alpha: false });
    this.scope = new Oscilloscope(
      this.ctx,
      computedStyles.backgroundColor ?? "#333333",
      computedStyles.color ?? "#FF0000",
      5
    );
    return html`${this.canvas}`;
  }
};
window.customElements.define(
  "winter-audio-oscilloscope",
  WinterAudioOscilloscopeElement
);
var Oscilloscope = class {
  constructor(ctx, backgroundColor, strokeColor, strokeWidth) {
    this.ctx = ctx;
    this.backgroundColor = backgroundColor;
    this.strokeColor = strokeColor;
    this.strokeWidth = strokeWidth;
    this.active = false;
    this.sineOffset = 0;
    this.width = ctx.canvas.width;
    this.height = ctx.canvas.height;
    this.clear();
    this.drawSine();
  }
  static {
    __name(this, "Oscilloscope");
  }
  start() {
    this.active = true;
    window.requestAnimationFrame(() => this.draw());
  }
  stop() {
    this.active = false;
  }
  clear() {
    this.ctx.beginPath();
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }
  draw() {
    if (!prefersReducedMotion.matches) {
      this.drawAnalyzer();
    } else {
      this.drawSine();
    }
  }
  drawAnalyzer() {
    const data = AudioContextManager.instance.analyzerData;
    this.clear();
    this.ctx.lineJoin = "round";
    this.ctx.lineWidth = this.strokeWidth;
    this.ctx.strokeStyle = this.strokeColor;
    this.ctx.beginPath();
    for (let x = 0; x < this.width; x++) {
      const sampleIdx = Math.round(x / this.width * data.length);
      const sample = data[sampleIdx] ?? 0;
      const y = sample / 128 * this.height / 2;
      if (x === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    this.ctx.lineTo(this.width + 10, this.height / 2);
    this.ctx.stroke();
    if (this.active) {
      window.requestAnimationFrame(() => this.drawAnalyzer());
    }
  }
  drawSine() {
    this.clear();
    this.ctx.lineWidth = this.strokeWidth;
    this.ctx.strokeStyle = this.strokeColor;
    this.ctx.beginPath();
    const divider = 4;
    const width = this.width / divider;
    for (let i = -2; i < width + 2; i++) {
      var v = Math.sin(8 * Math.PI * (i / width) + this.sineOffset / 8);
      var y = this.height / 2 + v * this.height / 2 * 0.9;
      if (i === -2) {
        this.ctx.moveTo(i * divider, y);
      } else {
        this.ctx.lineTo(i * divider, y);
      }
    }
    this.ctx.stroke();
    this.sineOffset++;
    if (this.active) {
      window.requestAnimationFrame(() => this.drawSine());
    }
  }
};

// src/audio/player.ts
var WinterAudioPlayerElement = class extends CustomElement {
  static {
    __name(this, "WinterAudioPlayerElement");
  }
  static {
    this.instances = /* @__PURE__ */ new Set();
  }
  static {
    this.styles = [
      css`
            :host {
                box-sizing: border-box;
                display: flex;
                width: 100%;
                max-width: 100%;
                padding: 0;
                color: white;
                background-color: #408d94;
                flex-direction: column;
            }

            audio {
                box-sizing: border-box;
                display: block;
                width: 90%;
                margin: 1em auto;
            }

            winter-audio-oscilloscope {
                box-sizing: border-box;
                background-color: inherit;
                color: inherit;
                margin: 0.5rem 0;
            }

            p {
                box-sizing: border-box;
                text-align: center;
                margin: 0.5rem;
            }
        `
    ];
  }
  get currentTime() {
    return this.audio?.currentTime;
  }
  set currentTime(value) {
    this.audio.currentTime = value;
  }
  get duration() {
    return this.audio?.duration;
  }
  get ended() {
    return this.audio?.ended;
  }
  get networkState() {
    return this.audio?.networkState;
  }
  get paused() {
    return this.audio?.paused;
  }
  get readyState() {
    return this.audio?.readyState;
  }
  get volume() {
    return this.audio?.volume;
  }
  set volume(value) {
    this.audio.volume = value;
  }
  play() {
    this.audio?.play();
  }
  pause() {
    this.audio?.pause();
  }
  pauseOthers() {
    const staticThis = this.constructor;
    for (const instance of staticThis.instances) {
      if (instance !== this) {
        instance.pause();
      }
    }
  }
  connectSource() {
    const manager = AudioContextManager.instance;
    if (!this.audioSourceNode) {
      this.audioSourceNode = manager.createSource(this.audio);
    }
    manager.activeSource = this.audioSourceNode;
  }
  onAudioPlay() {
    this.pauseOthers();
    this.connectSource();
    this.oscilloscope.start();
  }
  onAudioPauseOrEnd() {
    this.oscilloscope.stop();
  }
  connectedCallback() {
    super.connectedCallback();
    const staticThis = this.constructor;
    staticThis.instances.add(this);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    const staticThis = this.constructor;
    staticThis.instances.delete(this);
  }
  render() {
    let sources = this.querySelectorAll("source");
    if (!sources.length) {
      sources = html`<source src="${this.src}" />`;
    }
    this.audio = html`<audio
            controls
            crossorigin="anonymous"
            loop="${this.loop}"
            title="${this.title}">
            ${sources}
        </audio>`;
    this.audio.addEventListener("play", () => {
      this.onAudioPlay();
    });
    this.audio.addEventListener("pause", () => {
      this.onAudioPauseOrEnd();
    });
    this.audio.addEventListener("ended", () => {
      this.onAudioPauseOrEnd();
    });
    this.oscilloscope = html`<winter-audio-oscilloscope></winter-audio-oscilloscope>`;
    return html` ${this.oscilloscope} ${this.audio}
            <p>${this.title}</p>`;
  }
};
__decorateClass([
  attribute({ type: String })
], WinterAudioPlayerElement.prototype, "src", 2);
__decorateClass([
  attribute({ type: Boolean })
], WinterAudioPlayerElement.prototype, "loop", 2);
window.customElements.define("winter-audio-player", WinterAudioPlayerElement);

// src/index.ts
var VERSION = "head";
export {
  teeth_exports as Teeth,
  VERSION,
  WinterAudioPlayerElement
};
//# sourceMappingURL=winter.js.map
