/*
    Copyright (c) 2021 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

function deg2rad(deg: number) {
    return (deg * Math.PI) / 180;
}

interface Text {
    thickness: number;
    pos: [number, number];
    angle: number;
    attr: string | string[];
    height: number;
    text: string;
    justify: [number, number];
    width: number;
}

interface Item {
    type: string | undefined;
    text: string;
}

interface Shape extends Item {
    pos: [number, number];
    angle: number;
    filled: boolean;
    width: number;
}

interface Polygon extends Shape {
    path2d: Path2D;
    polygons: [number, number][][];
}

interface Edge extends Shape {
    start: [number, number];
    end: [number, number];
    radius: number;
    startangle: number;
    endangle: number;
    cpa: any;
    cpb: any;
}

interface Pad {
    path2d: Path2D;
    polygons: [number, number][][];
    type: string;
    shape: string;
    pos: [number, number];
    angle: number;
    offset: [number, number];
    drillshape: string;
    drillsize: [number, number];
    size: [number, number];
    radius: number;
    chamfpos: number;
    chamfratio: number;
}

class Font {
    fontData: any;
    lastHadOverbar: boolean;

    constructor(fontData: any) {
        this.fontData = fontData;
        this.lastHadOverbar = false;
    }

    calculateFontPoint(
        linepoint: [number, number],
        text: Text,
        offsetx: number,
        offsety: number,
        tilt: number,
    ): [number, number] {
        let point: [number, number] = [
            linepoint[0] * text.width + offsetx,
            linepoint[1] * text.height + offsety,
        ];
        // This approximates pcbnew behavior with how text tilts depending on horizontal justification
        point[0] -=
            (linepoint[1] + 0.5 * (1 + text.justify[0])) * text.height * tilt;
        return point;
    }

    drawGlyph(
        ctx: CanvasRenderingContext2D,
        glyph: { l: any },
        positionFunc: (line: any) => [number, number],
    ) {
        for (let line of glyph.l) {
            ctx.beginPath();
            ctx.moveTo(...positionFunc(line[0]));
            for (let k = 1; k < line.length; k++) {
                ctx.lineTo(...positionFunc(line[k]));
            }
            ctx.stroke();
        }
    }

    drawOverbar(
        ctx: CanvasRenderingContext2D,
        glyph: { w: number },
        x: number,
        y: number,
        width: number,
        height: number,
        tilt: number,
    ) {
        const start: [number, number] = [x, -height * 1.4 + y];
        const end: [number, number] = [x + width * glyph.w, start[1]];

        if (!this.lastHadOverbar) {
            start[0] += height * 1.4 * tilt;
            this.lastHadOverbar = true;
        }

        ctx.beginPath();
        ctx.moveTo(...start);
        ctx.lineTo(...end);
        ctx.stroke();
    }

    draw(ctx: CanvasRenderingContext2D, text: Text, color: any) {
        ctx.save();
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = text.thickness;
        ctx.translate(...text.pos);
        ctx.translate(text.thickness * 0.5, 0);

        let angle = -text.angle;
        if (text.attr.includes("mirrored")) {
            ctx.scale(-1, 1);
            angle = -angle;
        }
        let tilt = 0;
        if (text.attr.includes("italic")) {
            tilt = 0.125;
        }

        let interline = text.height * 1.5 + text.thickness;
        let txt = text.text.split("\n");

        // KiCad ignores last empty line.
        if (txt[txt.length - 1] == "") txt.pop();
        ctx.rotate(deg2rad(angle));

        let offsety = ((1 - text.justify[1]) / 2) * text.height; // One line offset
        offsety -= (((txt.length - 1) * (text.justify[1] + 1)) / 2) * interline; // Multiline offset

        for (const i in txt) {
            let lineWidth = text.thickness + (interline / 2) * tilt;

            /* Calculate the overall width of the line first, needed for alignment. */
            for (let j = 0; j < txt[i]!.length; j++) {
                const txt_ij = txt[i]![j]!;
                if (txt_ij == "\t") {
                    let fourSpaces = 4 * this.fontData[" "].w * text.width;
                    lineWidth += fourSpaces - (lineWidth % fourSpaces);
                    continue;
                } else if (txt_ij == "~") {
                    j++;
                    if (j == txt[i]!.length) {
                        break;
                    }
                }
                lineWidth += this.fontData[txt_ij].w * text.width;
            }

            let offsetx = (-lineWidth * (text.justify[0] + 1)) / 2;
            let in_overbar = false;
            for (let j = 0; j < txt[i]!.length; j++) {
                const txt_ij = txt[i]![j]!;
                const glyph = this.fontData[txt_ij]!;

                if (txt_ij == "\t") {
                    let fourSpaces = 4 * this.fontData[" "].w * text.width;
                    offsetx += fourSpaces - (offsetx % fourSpaces);
                    continue;
                }

                if (txt_ij == "~") {
                    j++;
                    if (j == txt[i]!.length) break;
                    if (txt_ij != "~") {
                        in_overbar = !in_overbar;
                    }
                }

                if (in_overbar) {
                    this.drawOverbar(
                        ctx,
                        glyph,
                        offsetx,
                        offsety,
                        text.width,
                        text.height,
                        tilt,
                    );
                } else {
                    this.lastHadOverbar = false;
                }

                this.drawGlyph(ctx, glyph, (line: any) => {
                    return this.calculateFontPoint(
                        line,
                        text,
                        offsetx,
                        offsety,
                        tilt,
                    );
                });

                offsetx += glyph.w * text.width;
            }
            offsety += interline;
        }
        ctx.restore();
    }
}

class Draw {
    canvas: any;
    ctx: any;
    font: any;
    colors: any;

    constructor(canvas: HTMLCanvasElement, font: Font, colors: Colors) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.font = font;
        this.colors = colors;
    }

    clear() {
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.fillStyle = this.colors.board;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
    }

    /* Drawing commands. */

    edge(edge: Edge, color: string) {
        const ctx = this.ctx;

        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = edge.width;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctx.beginPath();
        if (edge.type == "segment") {
            ctx.moveTo(...edge.start);
            ctx.lineTo(...edge.end);
        }
        if (edge.type == "rect") {
            ctx.moveTo(...edge.start);
            ctx.lineTo(edge.start[0], edge.end[1]);
            ctx.lineTo(...edge.end);
            ctx.lineTo(edge.end[0], edge.start[1]);
            ctx.lineTo(...edge.start);
        }
        if (edge.type == "arc") {
            ctx.arc(
                ...edge.start,
                edge.radius,
                deg2rad(edge.startangle),
                deg2rad(edge.endangle),
            );
        }
        if (edge.type == "circle") {
            ctx.arc(...edge.start, edge.radius, 0, 2 * Math.PI);
            ctx.closePath();
        }
        if (edge.type == "curve") {
            ctx.moveTo(...edge.start);
            ctx.bezierCurveTo(...edge.cpa, ...edge.cpb, ...edge.end);
        }
        if ("filled" in edge && edge.filled) {
            ctx.fill();
        } else {
            ctx.stroke();
        }
    }

    polygon(shape: Shape, color: any) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(...shape.pos);
        ctx.rotate(deg2rad(-shape.angle));

        if ("filled" in shape && !shape.filled) {
            ctx.strokeStyle = color;
            ctx.lineWidth = shape.width;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.stroke(this.makePolygonPath(shape as Polygon));
        } else {
            ctx.fillStyle = color;
            ctx.fill(this.makePolygonPath(shape as Polygon));
        }
        ctx.restore();
    }

    item(item: Item, color: any) {
        if (item.text) {
            this.font.draw(this.ctx, item, color);
        } else if (item.type == "polygon") {
            this.polygon(item as Shape, color);
        } else if (item.type !== undefined) {
            this.edge(item as Edge, color);
        } else {
            console.error("Unknown drawing item", item);
        }
    }

    items(items: any, color: any) {
        for (const item of items) {
            this.item(item, color);
        }
    }

    drawPad(pad: Pad, color: any, outline: boolean) {
        const ctx = this.ctx;

        ctx.save();
        ctx.translate(...pad.pos);
        ctx.rotate(deg2rad(pad.angle));
        if (pad.offset) {
            ctx.translate(...pad.offset);
        }
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        let path = this.makePadPath(pad);
        if (outline) {
            ctx.stroke(path);
        } else {
            ctx.fill(path);
        }
        ctx.restore();
    }

    drawPadHole(pad: Pad, color: any) {
        const ctx = this.ctx;

        if (pad.type != "th") return;
        ctx.save();
        ctx.translate(...pad.pos);
        ctx.rotate(deg2rad(pad.angle));
        ctx.fillStyle = color;
        if (pad.drillshape == "oblong") {
            ctx.fill(this.makeOblongPath(pad.drillsize));
        } else {
            ctx.fill(this.makeCirclePath(pad.drillsize[0] / 2));
        }
        ctx.restore();
    }

    footprint(
        layer: any,
        footprint: {
            drawings: any;
            pads: any;
            layer: any;
            bbox: { pos: any; angle: number; relpos: any; size: any };
        },
        highlight: boolean,
        pin_one_highlighted: boolean,
    ) {
        const ctx = this.ctx;

        for (let item of footprint.drawings) {
            if (item.layer == layer) {
                this.item(item, this.colors.pad);
            }
        }

        for (let pad of footprint.pads) {
            if (pad.layers.includes(layer)) {
                this.drawPad(pad, this.colors.pad, false);
                if (pad.pin1 && pin_one_highlighted) {
                    this.drawPad(pad, this.colors.pin1, true);
                }
            }
        }

        for (let pad of footprint.pads) {
            this.drawPadHole(pad, this.colors.hole);
        }

        if (highlight) {
            // draw bounding box
            if (footprint.layer == layer) {
                ctx.save();
                ctx.translate(...footprint.bbox.pos);
                ctx.rotate(deg2rad(-footprint.bbox.angle));
                ctx.translate(...footprint.bbox.relpos);
                ctx.fillStyle = this.colors.highlight_fill;
                ctx.fillRect(0, 0, ...footprint.bbox.size);
                ctx.strokeStyle = this.colors.highlight_stroke;
                ctx.strokeRect(0, 0, ...footprint.bbox.size);
                ctx.restore();
            }
        }
    }

    footprints(
        footprints: string | any[],
        layer: string,
        highlighted_footprints: Record<string, boolean> = {},
        pin_one_highlighted_footprints: Record<string, boolean> = {},
    ) {
        const ctx = this.ctx;
        ctx.lineWidth = 1 / 4;

        for (let i = 0; i < footprints.length; i++) {
            let mod = footprints[i];
            let highlighted = highlighted_footprints[mod.ref] ? true : false;
            let pin_one_highlighted = pin_one_highlighted_footprints[mod.ref]
                ? true
                : false;
            this.footprint(layer, mod, highlighted, pin_one_highlighted);
        }
    }

    /* Path generation commands */

    makeChamferedRectPath(
        size: any[],
        radius: number,
        chamfpos: number,
        chamfratio: number,
    ) {
        // chamfpos is a bitmask, left = 1, right = 2, bottom left = 4, bottom right = 8
        let path = new Path2D();
        let width = size[0];
        let height = size[1];
        let x = width * -0.5;
        let y = height * -0.5;
        let chamfOffset = Math.min(width, height) * chamfratio;
        path.moveTo(x, 0);
        if (chamfpos & 4) {
            path.lineTo(x, y + height - chamfOffset);
            path.lineTo(x + chamfOffset, y + height);
            path.lineTo(0, y + height);
        } else {
            path.arcTo(x, y + height, x + width, y + height, radius);
        }
        if (chamfpos & 8) {
            path.lineTo(x + width - chamfOffset, y + height);
            path.lineTo(x + width, y + height - chamfOffset);
            path.lineTo(x + width, 0);
        } else {
            path.arcTo(x + width, y + height, x + width, y, radius);
        }
        if (chamfpos & 2) {
            path.lineTo(x + width, y + chamfOffset);
            path.lineTo(x + width - chamfOffset, y);
            path.lineTo(0, y);
        } else {
            path.arcTo(x + width, y, x, y, radius);
        }
        if (chamfpos & 1) {
            path.lineTo(x + chamfOffset, y);
            path.lineTo(x, y + chamfOffset);
            path.lineTo(x, 0);
        } else {
            path.arcTo(x, y, x, y + height, radius);
        }
        path.closePath();
        return path;
    }

    makeOblongPath(size: [number, number]) {
        return this.makeChamferedRectPath(
            size,
            Math.min(size[0], size[1]) / 2,
            0,
            0,
        );
    }

    makePolygonPath(shape: Polygon) {
        if (shape.path2d) {
            return shape.path2d;
        }

        const path = new Path2D();
        for (const polygon of shape.polygons) {
            path.moveTo(...polygon[0]!);
            for (let i = 1; i < polygon.length; i++) {
                path.lineTo(...polygon[i]!);
            }
            path.closePath();
        }

        shape.path2d = path;

        return shape.path2d;
    }

    makeCirclePath(radius: number) {
        let path = new Path2D();
        path.arc(0, 0, radius, 0, 2 * Math.PI);
        path.closePath();
        return path;
    }

    makePadPath(pad: Pad) {
        if (pad.path2d) {
            return pad.path2d;
        }

        if (pad.shape == "rect") {
            pad.path2d = new Path2D();
            const start = pad.size.map((c: number) => -c * 0.5) as [
                number,
                number,
            ];
            pad.path2d.rect(...start, ...pad.size);
        } else if (pad.shape == "oval") {
            pad.path2d = this.makeOblongPath(pad.size);
        } else if (pad.shape == "circle") {
            pad.path2d = this.makeCirclePath(pad.size[0] / 2);
        } else if (pad.shape == "roundrect") {
            pad.path2d = this.makeChamferedRectPath(pad.size, pad.radius, 0, 0);
        } else if (pad.shape == "chamfrect") {
            pad.path2d = this.makeChamferedRectPath(
                pad.size,
                pad.radius,
                pad.chamfpos,
                pad.chamfratio,
            );
        } else if (pad.shape == "custom") {
            pad.path2d = this.makePolygonPath(pad as unknown as Polygon);
        }

        return pad.path2d;
    }
}

class Colors {
    constructor(elem: Element) {
        const color_names = [
            "edge-cuts",
            "board",
            "pad",
            "hole",
            "pin1",
            "silk",
            "highlight-stroke",
            "highlight-fill",
        ];

        const style = window.getComputedStyle(elem);

        for (const name of color_names) {
            const property_name = name.replace("-", "_");
            const css_name = `--${name}`;
            this[property_name] = (
                style.getPropertyValue(css_name) || "red"
            ).trim();
        }
    }

    [key: string]: string;
}

export class Renderer {
    elem: any;
    pcb_data: any;
    font: Font;
    colors: Colors;
    rotate: boolean;
    _angle: number;
    width: number;
    height: number;
    highlighted: Record<string, boolean> = {};
    pinOneHightlighted: Record<string, boolean> = {};
    front: Draw;
    back: Draw;

    constructor(elem: HTMLElement, pcb_data: { font_data: any }) {
        this.elem = elem;
        this.pcb_data = pcb_data;
        this.font = new Font(pcb_data.font_data);
        this.colors = new Colors(elem);
        this.rotate = elem.dataset["pcbRotate"] !== undefined;
        this._angle = 0;

        this.width =
            this.pcb_data.edges_bbox.maxx - this.pcb_data.edges_bbox.minx;
        this.height =
            this.pcb_data.edges_bbox.maxy - this.pcb_data.edges_bbox.miny;

        if (this.rotate) {
            const height = this.height;
            this.height = this.width;
            this.width = height;
        }

        this.highlighted = {};
        this.pinOneHightlighted = {};

        this.makeCanvases();
        this.draw();
    }

    highlight(refs: string[]) {
        this.highlighted = {};
        for (const ref of refs) {
            this.highlighted[ref] = true;
        }
        this.draw();
    }

    highlightPinOne(refs: any) {
        this.pinOneHightlighted = {};
        for (const ref of refs) {
            this.pinOneHightlighted[ref] = true;
        }
        this.draw();
    }

    /* Content building */

    makeCanvases() {
        this.front = new Draw(
            this.makeCanvas(this.elem, this.width, this.height, "front"),
            this.font,
            this.colors,
        );
        this.back = new Draw(
            this.makeCanvas(this.elem, this.width, this.height, "back"),
            this.font,
            this.colors,
        );
    }

    makeCanvas(
        parent: { appendChild: (arg0: HTMLCanvasElement) => void },
        width: number,
        height: number,
        class_: string,
        scale = 10,
    ) {
        const canvas = document.createElement("canvas");
        canvas.classList.add(class_);
        canvas.width = width * window.devicePixelRatio * scale;
        canvas.height = height * window.devicePixelRatio * scale;
        canvas.dataset["scale"] = `${scale}`;
        parent.appendChild(canvas);
        return canvas;
    }

    /* Drawing */

    draw() {
        this.setCanvasTransform(this.front.canvas, false);
        this.front.clear();
        this.front.items(
            this.pcb_data.drawings.silkscreen.F,
            this.colors["silk"],
        );
        this.front.footprints(
            this.pcb_data.footprints,
            "F",
            this.highlighted,
            this.pinOneHightlighted,
        );
        this.front.items(this.pcb_data.edges, this.colors["edge_cuts"]);

        this.setCanvasTransform(this.back.canvas, true);
        this.back.clear();
        this.back.items(
            this.pcb_data.drawings.silkscreen.B,
            this.colors["silk"],
        );
        this.back.footprints(
            this.pcb_data.footprints,
            "B",
            this.highlighted,
            this.pinOneHightlighted,
        );
        this.back.items(this.pcb_data.edges, this.colors["edge_cuts"]);

        setTimeout(() => this.draw(), 200);
    }

    setCanvasTransform(canvas: HTMLCanvasElement, mirror: boolean | undefined) {
        const ctx = canvas.getContext("2d")!;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(
            parseFloat(canvas.dataset["scale"]!) * window.devicePixelRatio,
            parseFloat(canvas.dataset["scale"]!) * window.devicePixelRatio,
        );
        if (this.rotate) {
            const x = this.width / 2;
            const y = this.height / 2;
            ctx.translate(x, y);
            ctx.rotate(deg2rad(90));
            ctx.translate(-y, -x);
        }
        ctx.translate(
            -this.pcb_data.edges_bbox.minx,
            -this.pcb_data.edges_bbox.miny,
        );
    }
}
