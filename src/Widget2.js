import { View } from "@croquet/croquet";
import { v2_sub, v2_multiply, v2_add, v2_scale, v4_scale, v2_normalize, v2_magnitude } from "./Vector";
import { LoadFont, LoadImage} from "./ViewAssetCache";
import { NamedView } from "./NamedView";
import QRCode from "../lib/qr/qrcode";

let ui;             // The UI manager

let pressedControls = new Map();    // Maps pointer ids to the control widget they were last pressed inside
let focusedControl;                 // The control widget that last was pressed by any pointer

//------------------------------------------------------------------------------------------
//-- Helper Functions ----------------------------------------------------------------------
//------------------------------------------------------------------------------------------

// Widget attributes can be either values or arrays ... this compares arbitrary things.

function deepEquals(a, b) {
    if (a === b) return true;
    if (!a || !b) return false;
    const al = a.length;
    const bl = b.length;
    if (!al || !bl) return false;
    if (al !== bl) return false;
    for (let i = 0; i < al; i++) if (a[i] !== b[i]) return false;
    return true;
}

function canvasColor(r, g, b) {
    return 'rgb(' + Math.floor(255 * r) + ', ' + Math.floor(255 * g) + ', ' + Math.floor(255 * b) +')';
}

function isLetter(c) { // Returns true if the character is an alphabetic letter.
    return c.toLowerCase() !== c.toUpperCase();
}

function isDigit(c) { // Returns true if the character is a digit.
    return c.match(/[0-9]/i);
}

function isLetterOrDigit(c) {
    return isLetter(c) || isDigit(c);
}


//------------------------------------------------------------------------------------------
//-- UIManager -----------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

// The UI is the top-level UI manager. It creates the canvas that the UI is drawn on, and catches events
// and passes them to the widget tree.
//
// It re-publishes pointer events after it's given the UI widgets a chance to intercept them.
//
// Takes the device's pixel ratio into account. This can be over-ridden using SetScale.

export class UIManager extends NamedView {

    constructor() {
        super('UIManager');

        ui = this; // Global pointer for widgets to use.

        this.scale = 1;
        this.size = [100,100];
        this.global = [0,0];

        this.resize();
        this.root = new CanvasWidget(this, {autoSize: [1,1]});

        // this.fakeText = document.createElement("input"); // This is a hack to trigger a virtual keyboard on a mobile device
        // this.fakeText.setAttribute("type", "text");
        // this.fakeText.style.position = "absolute";
        // this.fakeText.value = "A"; // Fool keyboard into not automatically using caps
        // this.fakeText.style.opacity = "0";
        // this.fakeText.addEventListener("focusout", this.fakeTextBlur);
        // document.body.insertBefore(this.fakeText, null);

        this.subscribe("input", {event: "resize", handling: "immediate"}, this.resize);
        this.subscribe("input", {event: "pointerMove", handling: "immediate"}, this.pointerMove);
        this.subscribe("input", {event: "pointerDown", handling: "immediate"}, this.pointerDown);
        this.subscribe("input", {event: "pointerUp", handling: "immediate"}, this.pointerUp);

        // this.subscribe("input", {event: "mouseXY", handling: "immediate"}, this.mouseXY);
        // this.subscribe("input", {event: "mouse0Down", handling: "immediate"}, this.mouseDown);
        // this.subscribe("input", {event: "mouse0Up", handling: "immediate"}, this.mouseUp);

        // this.subscribe("input", {event: "mouse0Double", handling: "immediate"}, this.mouseDouble);
        // this.subscribe("input", {event: "mouse0Triple", handling: "immediate"}, this.mouseTriple);

        // this.subscribe("input", {event: "touchXY", handling: "immediate"}, this.touchXY);
        // this.subscribe("input", {event: "touchDown", handling: "immediate"}, this.touchDown);
        // this.subscribe("input", {event: "touchUp", handling: "immediate"}, this.touchUp);
        // this.subscribe("input", {event: "touchTap", handling: "immediate"}, this.touchTap);

        // this.subscribe("input", {event: "keyDown", handling: "immediate"}, this.keyDown);
        // this.subscribe("input", {event: "keyRepeat", handling: "immediate"}, this.keyDown);
    }

    destroy() {
        super.destroy();
        // pressedControls.clear();
        // if (focusedControl) focusedControl.blur();
        if (this.root) this.root.destroy();
        ui = null;
    }

    addChild(root) {
        root.setParent(this);
    }

    removeChild(child) {
        if (this.root === child) this.root = null;
    }

    get isVisible() { return true; }

    resize() {
        // if (focused) focused.blur();
        this.ratio = window.devicePixelRatio;
        // console.log("UI Pixel Ratio: " + this.ratio);
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.size = [width, height];
        if (this.root) this.root.markChanged();
        this.publish("ui", "resize", this.size);
    }

    setScale(scale) {
        this.scale = scale;
        if (this.root) this.root.markChanged();
    }

    update() {
        if (!this.isChanged) return;
        this.isChanged = false;
        this.root.update();
    }

    markChanged() {
        this.isChanged = true;
    }

    pointerMove(event) {
        const pressed = pressedControls.get(event.id);
        if (pressed) {
            pressed.pointerDrag(event);
        } else if (event.type === "mouse" && this.root) {
            this.root.pointerMove(event);
            this.publish("ui", "pointerMove", event);
        }
    }

    pointerDown(event) {
        if (event.button !== 0) return;
        if (this.root && this.root.pointerDown(event)) return;
        this.publish("ui", "pointerDown", event);
    }

    pointerUp(event) {
        if (event.button !== 0) return;
        const pressed = pressedControls.get(event.id);
        if (pressed) {
            pressed.pointerUp(event); }
        else {
            this.publish("ui", "pointerUp", event);
        }
    }

    // mouseXY(xy) {
    //     const oldHover = hover;
    //     this.root.setCursor('default');
    //     if (this.inMouseDown) {
    //         if (focus) focus.drag(xy);
    //     } else {
    //         if (hover) hover.mouseMove(xy);
    //         if (this.root) this.root.mouseMove(xy);
    //     }
    //     if (oldHover !== hover) {
    //         if (oldHover) {
    //             oldHover.onUnhover();
    //             oldHover.markChanged();
    //         }
    //         if (hover) {
    //             hover.onHover();
    //             hover.markChanged();
    //         }
    //     }
    //     if (!focus && !hover) this.publish("ui", "mouseXY", xy);
    // }

    // mouseDown(xy) {
    //     this.inMouseDown = true;
    //     if (focus && focus.press(xy)) return;
    //     if (hover && hover.press(xy)) return;
    //     this.publish("ui", "mouse0Down", xy);
    // }

    // mouseUp(xy) {
    //     this.inMouseDown = false;
    //     if (focus) focus.release(xy);
    //     this.publish("ui", "mouse0Up", xy);
    // }

    // touchXY(xy) {
    //     if (focus) focus.drag(xy);
    //     this.publish("ui", "touchXY", xy);
    // }

    // touchDown(xy) {
    //     if (this.root && this.root.press(xy)) return;
    //     this.canTap = true;
    //     this.publish("ui", "touchDown", xy);
    // }

    // touchUp(xy) {
    //     if (focus) focus.release(xy);
    //     this.canTap = false;
    //     this.publish("ui", "touchUp", xy);
    // }

    // touchTap(xy) {
    //     if (!this.canTap) return;
    //     this.publish("ui", "touchTap", xy);
    // }

    // mouseDouble(xy) {
    //     if (!focus || !focus.doubleClick) return;
    //     focus.doubleClick(xy);
    // }

    // mouseTriple(xy) {
    //     if (!focus || !focus.tripleClick) return;
    //     focus.tripleClick(xy);
    // }


    // keyDown(key) {
    //     if (focus && focus.keyInput) focus.keyInput(key);
    // }


    // This is a hack to trigger the virtual keyboard on mobile. There is an invisible text entry element that
    // gets drawn underneath the real text entry widget. Giving this fake text field focus pops up the
    // keyboard. When we have our own virtual keyboard as part of the widget system, this should go away.

    // requestVirtualKeyboard(xy) {
    //     this.fakeText.style.left = xy[0] + 'px';
    //     this.fakeText.style.top = xy[1] + 'px';
    //     this.fakeText.focus();
    // }

    // dismissVirtualKeyboard() {
    //     this.fakeText.blur();
    // }

    // fakeTextBlur() {
    //     this.value = "A"; // This prevents the virtual keyboard from defaults to caps
    //     if (focus) focus.blur();
    // }

}

//------------------------------------------------------------------------------------------
//-- Widget --------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

// The base widget class.

export class Widget extends View {
    constructor(parent, options) {
        super();
        this.set(options);
        if (parent) parent.addChild(this);

        this.buildChildren();

        this.subscribe(this.id, { event: "visible", handling: "immediate" }, visible => {if (!visible) this.markCanvasChanged(); this.visiblityChanged();} );
        this.subscribe(this.id, { event: "scale", handling: "immediate" }, () => { this.markCanvasChanged();} );
    }

    destroy() {
        if (this.children) this.children.forEach(child => child.destroy());
        if (this.parent) this.parent.removeChild(this);
        this.detach();
    }

    addChild(child) {
        if (!child || child.parent === this) return;
        if (!this.children) this.children = new Set();
        if (child.parent) child.parent.removeChild(child);
        this.children.add(child);
        child.setParent(this);
        child.setCanvasWidget(this.canvasWidget);
        this.markChanged();
    }

    removeChild(child) {
        if (!child) return;
        if (this.children) this.children.delete(child);
        child.setParent(null);
        this.markChanged();
    }

    destroyChild(child) {
        if (!child) return;
        this.removeChild(child);
        child.destroy();
    }

    setParent(p) {  // This should only be called by addChild & removeChild
        this.parent = p;
    }

    setCanvasWidget(canvasWidget) {
        if (canvasWidget === this.canvasWidget) return;
        this.canvasWidget = canvasWidget;
        if (this.children) this.children.forEach(child => child.setCanvasWidget(this.canvasWidget));
    }

    get cc() {return this.canvasWidget.context;}

    setCursor(c) {
        this.canvasWidget.element.style.cursor = c;
    }

    markChanged() {
        ui.markChanged();
        this.$scale = undefined;
        this.$size = undefined;
        this.$global = undefined;
        this.$origin = undefined;
        if (this.isChanged) return;
        this.isChanged = true;
        if (this.bubbleChanges && this.parent) this.parent.markChanged();
        if (this.children) this.children.forEach(child => child.markChanged());
    }

    // Mark the whole canvas changed (used for hiding widgets)
    markCanvasChanged() {
        if (this.canvasWidget) this.canvasWidget.markChanged();
    }

    set(options) {
        let changed = false;
        for (const option in options) {
            const n = "_" + option;
            const v = options[option];
            if (!deepEquals(this[n], v)) {
                this[n] = v;
                changed = true;
                this.publish(this.id, option, v);
            }
        }
        if (changed) this.markChanged();
    }

    show() { this.set({visible: true}); }
    hide() { this.set({visible: false}); }
    toggleVisible() { this.set({visible: !this.isVisible}); }

    visiblityChanged() {
        if (this.children) this.children.forEach(child => child.visiblityChanged());
    }

    get anchor() { return this._anchor || [0,0];}
    get pivot() { return this._pivot || [0,0];}
    get local() { return this._local || [0,0];}
    get autoSize() { return this._autoSize || [0,0];}
    get isClipped() { return this._clip; }  // Default to false
    get isVisible() { return this._visible === undefined || this._visible;} // Default to true
    get color() { return this._color || [0,0,0];}
    get bubbleChanges() { return this._bubbleChanges; } // Default to false
    get rawSize() { return this._size || [100,100];}

    get width() { return this._width || 0};
    get height() { return this._height || 0};

    get opacity() { // Children don't inherit opacity, but the opacity of a canvas applies to everything drawn on it.
        if (this._opacity === undefined) return 1;
        return (this._opacity);
    }

    get scale() {
        if (this.$scale) return this.$scale;
        this.$scale = this._scale || 1;
        if (this.parent) this.$scale *= this.parent.scale;
        return this.$scale;
    }

    get border() { return v4_scale((this._border || [0,0,0,0]), this.scale); }

    // Returns the size of the drawable area
    get size() {
        if (this.$size) return this.$size;
        const size = this._size || [100,100];
        this.$size = v2_scale(size, this.scale);
        if (this.parent) {
            const parentSize = this.parent.size;
            if (this.autoSize[0]) this.$size[0] = parentSize[0] * this.autoSize[0];
            if (this.autoSize[1]) this.$size[1] = parentSize[1] * this.autoSize[1];
        }
        const border = this.border;
        this.$size[0] -= (border[0] + border[2]);
        this.$size[1] -= (border[1] + border[3]);
        return this.$size;
    }

    // Returns the upper left corner in global coordinates
    get global() {
        if (this.$global) return this.$global;
        const local = v2_scale(this.local, this.scale);
        // const local = this.local;
        if (this.parent) {
            const border = this.border;
            const size = [...this.size];
            size[0] += (border[0] + border[2]);
            size[1] += (border[1] + border[3]);
            const anchor = v2_multiply(this.parent.size, this.anchor);
            const pivot = v2_multiply(size, this.pivot);
            const offset = v2_sub(anchor, pivot);
            const ulBorder = [border[0], border[1]];
            this.$global = v2_add(this.parent.global, v2_add(ulBorder, v2_add(local, offset)));
        } else {
            this.$global = local;
        }
        return this.$global;
    }

    // Returns the upper left corner relative to the drawing canvas
    get origin() {
        if (this.$origin) return this.$origin;
        this.$origin = v2_sub(this.global, this.canvasWidget.global);
        return this.$origin;
    }

    //Returns true if the global point is inside the element
    inside(xy) {
        const x = xy[0];
        const y = xy[1];
        if (x < this.global[0] || x > (this.global[0] + this.size[0])) return false;
        if (y < this.global[1] || y > (this.global[1] + this.size[1])) return false;
        return true;
    }

    pointerMove(event) {
        if (!this.isVisible) return;
        if (this.children) this.children.forEach(child => child.pointerMove(event));
    }

    pointerDown(event) {
        if (!this.isVisible) return false;
        let consumed = false;
        if (this.children) this.children.forEach(child => consumed = child.pointerDown(event) || consumed);
        return consumed;
    }

    pointerUp(event) {}

    pointerDrag(event) {}

    // mouseMove(xy) { // Propagates down the widget tree.
    //     if (!this.isVisible || !this.inside(xy)) return;
    //     if (this.children) this.children.forEach(child => child.mouseMove(xy));
    // }

    // press(xy) { // Propagates down the widget tree. Returns true if a child handles it.
    //     if (!this.isVisible || !this.inside(xy)) return false;
    //     let consumed = false;
    //     if (this.children) this.children.forEach(child => consumed = child.press(xy) || consumed);
    //     return consumed;
    // }

    // release(xy) {} // Only sent to the current focus.

    // drag(xy) {} // Only sent to the current focus.

    update() {
        if (!this.isVisible) return;
        this.cc.save();
        this.cc.globalAlpha = this.opacity;
        if (this.isClipped) this.clip();
        if (this.isChanged) this.draw();
        if (this.children) this.updateChildren();
        this.cc.restore();
        this.isChanged = false;
    }

    // Some complex widgets need more control over how they build and update their children
    buildChildren() {}

    updateChildren() {
        this.children.forEach(child => child.update());
    }

    clip() {
        this.cc.rect(this.global[0], this.global[1], this.size[0], this.size[1]);
        this.cc.clip();
    }

    clear() {
        const xy = this.global;
        const size = this.size;
        this.cc.clearRect(xy[0], xy[1], size[0], size[1]);
    }

    draw() {}

}

//------------------------------------------------------------------------------------------
//-- ElementWidget -------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

// Manages an independent DOM element as a widget.

export class ElementWidget extends Widget {

    destroy() {
        super.destroy();
        this.element.remove();
    }

    get color() { return this._color; } // Null = transparent
    get zIndex() { if (this._zIndex === undefined) { return 1; } return this._zIndex; }

    visiblityChanged() {
        this.draw();
        super.visiblityChanged();
    }

    get ancestorsAreVisible() {
        let v = this.isVisible;
        let p = this.parent;
        while (p) {
            v = v && p.isVisible;
            p = p.parent;
        }
        return v;
    }

    draw() {
        this.element.style.zIndex = "" + this.zIndex;
        this.element.style.opacity = "" + this.opacity;
        if (this.color) {
            this.element.style.background = canvasColor(...this.color);
        } else {
            this.element.style.background = 'transparent';
        }

        const ratio = ui.ratio;
        if (this.ancestorsAreVisible) {
            this.element.style.display = 'inline';
        } else {
            this.element.style.display = 'none';
        }
        const left = this.global[0];
        const top = this.global[1];
        const width = this.size[0];
        const height = this.size[1];
        this.element.width = width * ratio;
        this.element.height = height * ratio;
        this.element.style.top = top + "px";
        this.element.style.left = left + "px";
        this.element.style.width = width + "px";
        this.element.style.height = height + "px";
    }
}

//------------------------------------------------------------------------------------------
//-- CanvasWidget --------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

export class CanvasWidget extends ElementWidget {
    constructor(...args) {
        super(...args);
        this.element = document.createElement("canvas");
        this.element.style.cssText = "position: absolute; left: 0; top: 0; border: 0;";
        document.body.insertBefore(this.element, null);

        this.context = this.element.getContext('2d');
        this.canvasWidget = this;
    }

    setCanvasWidget() {
        this.canvasWidget = this;
        if (this.children) this.children.forEach(child => child.setCanvasWidget(this.canvasWidget));
    }

    draw() {
        super.draw();
        this.cc.scale(ui.ratio, ui.ratio);
        this.clear();
    }
}

//------------------------------------------------------------------------------------------
//-- EmptyWidget ---------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

// Clears the background when its drawn

export class EmptyWidget extends Widget {

    draw() {
        this.clear();
    }

}

//------------------------------------------------------------------------------------------
//-- BoxWidget -----------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

// Draws an area filled with a solid color.

export class BoxWidget extends Widget {

    draw() {
        const xy = this.origin;
        const size = this.size;
        this.cc.fillStyle = canvasColor(...this.color);
        this.cc.fillRect(xy[0], xy[1], size[0], size[1]);
    }

}

//------------------------------------------------------------------------------------------
//-- TextWidget ----------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

// Draws a piece of static text.
//
// Text should always be drawn over some background widget to refresh properly. When a text
// widget is updated, it triggers a refresh of its parent. If you floating text, put in in an
// EmptyWidget.
//
// Needs:
//
// * Selection methods for multiline text
// * Maybe single and multiline text get split into different widgets?

export class TextWidget extends Widget {

    constructor(...args) {
        super(...args);
        if (this.url) this.setFontByURL(this.url);
        this.subscribe(this.id, { event: "url", handling: "immediate" }, this.setFontByURL);
    }

    setText(t) {this.set({text: t});}

    setFontByURL(url) {
        this._font = LoadFont(url, () => this.markChanged());
        this.markChanged();
    }

    get url() { return this._url; }
    get bubbleChanges() { return this._bubbleChanges === undefined || this._bubbleChanges;} // Override to default to true
    get text() { if (this._text !== undefined) return this._text; return "Text";}
    get font() { return this._font || "sans-serif";}
    get point() { return (this._point || 24) * this.scale;}
    get lineSpacing() { return (this._lineSpacing || 0) * this.scale;}
    get style() { return this._style || "normal";}
    get alignX() { return this._alignX || "center";}
    get alignY() { return this._alignY || "middle";}
    get wrap() { return this._wrap === undefined || this._wrap;} // Default to true

    // Breaks lines by word wrap or new line.

    get lines() {
        if (!this.wrap) return this.text.split('\n');
        const spaceWidth = this.cc.measureText(' ').width;
        const sizeX = this.size[0];
        const words = this.text.split(' ');
        const out = [];
        let sum = sizeX+1;
        words.forEach( word => {
            const wordWidth = this.cc.measureText(word).width;
            if (word.includes('\n')) {
                const split = word.split('\n');
                split.forEach((s,i) => {
                    const sWidth = this.cc.measureText(s).width;
                    if (i > 0 || sum + spaceWidth + sWidth > sizeX) {
                        sum = sWidth;
                        out.push(s);
                    } else {
                        sum += spaceWidth + sWidth;
                        out[out.length-1] += ' ' + s;
                    }
                });
            } else if (sum + spaceWidth + wordWidth > sizeX) {
                sum = wordWidth;
                out.push(word);
            } else {
                sum += spaceWidth + wordWidth;
                out[out.length-1] += ' ' + word;
            }
        });
        return out;
    }

    draw() {
        const lineHeight = (this.point + this.lineSpacing);

        this.cc.textAlign = this.alignX;
        this.cc.textBaseline = this.alignY;
        this.cc.font = this.style + " " + this.point + "px " + this.font;
        this.cc.fillStyle = canvasColor(...this.color);

        const lines = this.lines;

        let xy = [0,0];
        let yOffset = 0;
        if (this.alignX === "center") {
            xy[0] = this.size[0] / 2;
        } else if (this.alignX === "right") {
            xy[0] = this.size[0];
        }
        if (this.alignY === "middle") {
            xy[1] = this.size[1] / 2;
            yOffset = lineHeight * (lines.length-1) / 2;
        } else if (this.alignY === "bottom") {
            xy[1] = this.size[1];
            yOffset = lineHeight * (lines.length-1);
        }
        xy = v2_add(this.origin, xy);

        lines.forEach((line,i) => this.cc.fillText(line, xy[0], xy[1] + (i * lineHeight) - yOffset));
    }

    pixelWidth() { // Returns the full width of the text in pixels given the current font.
        this.cc.font = this.style + " " + this.point + "px " + this.font;
        return this.cc.measureText(this.text).width;
    }

    findSelect(x) { // Given a point in local coordinates, finds the selection point in the text string.
        this.cc.font = this.style + " " + this.point + "px " + this.font;
        const c = [...this.text];
        let sum = 0;
        for (let i = 0; i < c.length; i++) {
            const w = this.cc.measureText(c[i]).width;
            if (x < sum + w/2) return i;
            sum += w;
        }
        return c.length;
    }

    findLetterOffset(n) { // Given a position in the text, finds the x offset in local coordinates.
        this.cc.font = this.style + " " + this.point + "px " + this.font;
        const c = [...this.text];
        let offset = 0;
        n = Math.min(n, c.length);
        for (let i = 0; i < n; i++) {
            offset += this.cc.measureText(c[i]).width;
        }
        return Math.max(0, Math.floor(offset));
    }

}

//------------------------------------------------------------------------------------------
//-- ControlWidget -------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

// Base class for all widgets that can be interacted with.

// Control widgets have enabled/disabled states. The disabled state is implemented with a translucent overlay.
// If the widget has an irregular shape, you'll need to provide an overlay that matches the control shape.

export class ControlWidget extends Widget {
    constructor(...args) {
        super(...args);
        this.isHovered = false;
        this.isPressed = false;
    }

    buildChildren() {
        super.buildChildren();
        this.setDim(new BoxWidget(this, {autoSize: [1,1], color: [0.8,0.8,0.8], opacity: 0.6, bubbleChanges: true}));
    }

    enable() { this.set({ disabled: false }); }
    disable() { this.set({ disabled: true }); }
    toggleDisabled() { this.set({ disabled: !this.disabled }); }

    get isDisabled() { return this._disabled;}

    setDim(w) {
        if (this.dim && this.dim !== w) this.destroyChild(this.dim);
        this.dim = w;
        this.addChild(w);
    }

    pointerMove(event) {
        const inside = this.inside(event.xy);
        if (!this.isVisible || this.isDisabled || this.isHovered === inside) return;
        this.isHovered = inside;
        this.markChanged();
        this.isHovered ? this.onHover() : this.onUnhover();
    }

    pointerDrag(event) {
        const inside = this.inside(event.xy);
        this.onDrag(event.xy);
        if (this.isPressed === inside) return;
        this.isPressed = inside;
        this.markChanged();
    }

    pointerDown(event) {
        if (this.invisible || this.isDisabled || !this.inside(event.xy)) return false;
        pressedControls.set(event.id, this);
        this.isPressed = true;
        this.markChanged();
        this.focus();
        this.onPress(event.xy);
        return true;
    }

    pointerUp(event) {
        pressedControls.delete(event.id);
        this.isPressed = false;
        this.markChanged();
        this.onRelease(event.xy);
        if (this.inside(event.xy)) this.onClick(event.xy);
    }

    focus() {
        if (focusedControl) focusedControl.blur();
        focusedControl = this;
    }

    blur() {
        if (focusedControl !== this) return;
        focusedControl = null;
    }

    onHover() {}
    onUnhover() {}
    onPress(xy) {}
    onRelease(xy) {}
    onDrag(xy) {}
    onClick(xy) {} // Release while pressed and pointer is inside

}

//------------------------------------------------------------------------------------------
//-- ButtonWidget --------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

// Draws a pressable button.
//
// The Normal/Hovered/Pressed Box widgets can be replaced by NineSlice widgets for prettier buttons.

export class ButtonWidget extends ControlWidget {

    buildChildren() {
        super.buildChildren();
        this.setNormal(new BoxWidget(this, {autoSize: [1,1], color: [0.5,0.5,0.5], bubbleChanges: true}));
        this.setHilite(new BoxWidget(this, {autoSize: [1,1], color: [0.65,0.65,0.65], bubbleChanges: true}));
        this.setPressed(new BoxWidget(this, {autoSize: [1,1], color: [0.35,0.35,0.35], bubbleChanges: true}));
        this.setLabel(new TextWidget(this, {autoSize: [1,1]}));
    }

    setNormal(w) {
        if (this.normal && this.normal !== w) this.destroyChild(this.normal);
        this.normal = w;
        this.addChild(w);
    }

    setHilite(w) {
        if (this.hilite && this.hilite !== w) this.destroyChild(this.hilite);
        this.hilite = w;
        this.addChild(w);
    }

    setPressed(w) {
        if (this.pressed && this.presed !== w) this.destroyChild(this.pressed);
        this.pressed = w;
        this.addChild(w);
    }

    setLabel(w) {
        if (this.label && this.label !== w) this.destroyChild(this.label);
        this.label = w;
        this.addChild(w);
    }

    updateChildren() {
        let background = this.normal;
        if (this.isHovered) background = this.hilite;
        if (this.isPressed) background = this.pressed;
        if (background) background.update();
        if (this.label) this.label.update();
        if (this.isDisabled) this.dim.update();
    }
}

//------------------------------------------------------------------------------------------
//-- SliderWidget --------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

// Managages a slider.
//
// The Bar and Knob can be replaced by Image/NineSlice widgets for a prettier look.
// The Knob will always be square and matches the short dimension of the bar.

export class SliderWidget extends ControlWidget {

    get isHorizontal() { return this.size[0] > this.size[1]; }
    get step() { return this._step || 0; }        // The number of descrete steps the slider has. (0=continuous)

    get percent() {
        const p = this._percent || 0;
        if (!this.step) return p;
        return Math.round(p * (this.step-1)) / (this.step-1);
    }

    buildChildren() {
        super.buildChildren();
        this.setBar(new BoxWidget(this, {autoSize:[1,1], color: [0.5,0.5,0.5], bubbleChanges: true}));
        this.setKnob(new BoxWidget(this, {color: [0.8,0.8,0.8], border:[2,2,2,2], bubbleChanges: true}));
    }

    setBar(w) {
        if (this.bar && this.bar !== w) this.destroyChild(this.bar);
        this.bar = w;
        this.addChild(w);
    }

    setKnob(w) {
        if (this.knob && this.knob !== w) this.destroyChild(this.knob);
        this.knob = w;
        this.setKnobSize();
        this.addChild(w);
    }

    setKnobSize() {
        if (this.isHorizontal) {
            this.knob.set({autoSize:[0,1], size:[this.size[1]/this.scale, this.size[1]/this.scale]});
        } else {
            this.knob.set({autoSize:[1,0], size:[this.size[0]/this.scale, this.size[0]/this.scale]});
        }
        this.refreshKnob();
    }

    updateChildren() {
        this.refreshKnob();
        if (this.bar) this.bar.update();
        if (this.knob) this.knob.update();
        if (this.isDisabled) this.dim.update();
    }

    refreshKnob() {
        const xy = this.knob.local;
        if (this.isHorizontal) {
            xy[0] = (this.size[0] - (this.knob.size[0] + this.knob.border[0] + this.knob.border[2])) * this.percent / this.scale;
        } else {
            xy[1] = (this.size[1] - (this.knob.size[1] + this.knob.border[1] + this.knob.border[3])) * this.percent / this.scale;
        }
        this.knob.set({local:xy});
    }

    onPress(xy) {
        this.moveKnob(xy);
    }

    onRelease(xy) {
        this.moveKnob(xy);
    }

    onDrag(xy) {
        this.moveKnob(xy);
    }

    moveKnob(xy) {
        const local = v2_sub(xy, this.global);
        let p;
        if (this.isHorizontal) {
            p = Math.max(0,Math.min(1,local[0] / this.size[0]));
        } else {
            p = Math.max(0,Math.min(1,local[1] / this.size[1]));
        }
        this.set({percent: p});
        this.onChange(this.percent);
    }

    onChange(percent) {
    }

}

//------------------------------------------------------------------------------------------
//-- JoystickWidget ------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

// Managages a virtual joystick.
//
// The background and the knob can be set to image or nine-slice widgets to look prettier.
//
// Don't mess with the gate. It's a helper widget to limit the movement of the knob.
//
// The joystick outputs an xy vector. Each value can range from -1 to 1. The magnitude of the
// vector will never exceed 1.
//
// The deadRadius is the deadzone at the center of the joystick that always returns 0. It's % of
// the total radius of the control.


export class JoystickWidget extends ControlWidget {

    buildChildren() {
        super.buildChildren();

        this.setBackground(new BoxWidget(this, {color: [0.5,0.5,0.5]}));
        this.gate = new Widget(this.bg, {anchor: [0.5, 0.5], pivot: [0.5, 0.5], autoSize: [1, 1], border: [10,10,10,10], bubbleChanges: true})
        this.setKnob(new BoxWidget(this.gate, {color: [0.8,0.8,0.8], size: [20,20]}));
        this.deadRadius = 0.1;
        this.xy = [0,0];
    }

    setBackground(w) {
        if (this.bg && this.bg !== w) {
            this.bg.removeChild(this.gate);
            this.destroyChild(this.bg);
        }
        this.bg = w;
        this.bg.set({autoSize: [1,1], bubbleChanges: true})
        this.addChild(w);
        this.bg.addChild(this.gate);
    }

    setKnob(w) {
        if (this.knob && this.knob !== w) {
            this.gate.destroyChild(this.knob);
        }
        this.knob = w;
        this.knob.set({anchor: [0.5, 0.5], pivot: [0.5, 0.5], bubbleChanges: true})
        const size = this.knob.size;
        const x = size[0] / 2;
        const y = size[1] / 2;
        this.gate.set({border: [x,y,x,y]});
        this.gate.addChild(this.knob);
    }

    recenter() {
        this.knob.set({anchor: [0.5,0.5]});
        this.xy = [0,0];
        this.onChange([0,0]);
    }

    onPress(xy) {
        this.moveKnob(xy);
    }

    onRelease(xy) {
        this.recenter();
    }

    onDrag(xy) {
        this.moveKnob(xy);
    }

    moveKnob(xy) {
        const local = v2_sub(xy, this.gate.global);

        const x = 2 * local[0] / this.gate.size[0] - 1;
        const y = 2 * local[1] / this.gate.size[1] - 1;
        let v = [x,y];
        const m = v2_magnitude(v);

        if (m == 0) {
            this.recenter();
            return;
        }

        const n = v2_scale(v, 1/m);
        if (m > 1) v = n;

        this.knob.set({anchor: [(v[0]+1)/2,(v[1]+1)/2]});

        const clamp = Math.max(0, v2_magnitude(v)-this.deadRadius) / (1-this.deadRadius);
        this.xy = v2_scale(n,clamp);
        this.onChange(this.xy);
    }

    onChange(xy) {
    }
}




