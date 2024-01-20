/*
    Copyright (c) 2024 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { CustomElement, css, html } from "../base/web-components";
import { prefersReducedMotion } from "../base/media-queries";
import { AudioContextManager } from "./context-manager";

/**
 * Audio oscilloscope, used by WinterAudioPlayerElement
 */
export class WinterAudioOscilloscopeElement extends CustomElement {
    static override styles = [
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
        `,
    ];

    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private scope: Oscilloscope;

    public start() {
        this.scope.start();
    }

    public stop() {
        this.scope.stop();
    }

    override render() {
        const width = Math.floor(400 * window.devicePixelRatio);
        const height = Math.floor(100 * window.devicePixelRatio);
        const computedStyles = window.getComputedStyle(this);

        this.canvas = html`<canvas
            width="${width}"
            height="${height}"></canvas>` as HTMLCanvasElement;

        console.log(computedStyles.backgroundColor);

        this.ctx = this.canvas.getContext("2d", { alpha: false })!;
        this.scope = new Oscilloscope(
            this.ctx,
            computedStyles.backgroundColor ?? "#333333",
            computedStyles.color ?? "#FF0000",
            5,
        );

        return html`${this.canvas}`;
    }
}

window.customElements.define(
    "winter-audio-oscilloscope",
    WinterAudioOscilloscopeElement,
);

class Oscilloscope {
    public width: number;
    public height: number;
    public active: boolean = false;

    constructor(
        public ctx: CanvasRenderingContext2D,
        public backgroundColor: string,
        public strokeColor: string,
        public strokeWidth: number,
    ) {
        this.width = ctx.canvas.width;
        this.height = ctx.canvas.height;
        this.clear();
        this.drawSine();
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
            const sampleIdx = Math.round((x / this.width) * data.length);
            const sample = data[sampleIdx] ?? 0;
            const y = ((sample / 128) * this.height) / 2;

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

    private sineOffset = 0;

    drawSine() {
        this.clear();
        this.ctx.lineWidth = this.strokeWidth;
        this.ctx.strokeStyle = this.strokeColor;
        this.ctx.beginPath();

        const divider = 4;
        const width = this.width / divider;

        for (let i = -2; i < width + 2; i++) {
            var v = Math.sin(8 * Math.PI * (i / width) + this.sineOffset / 8);
            var y = this.height / 2 + ((v * this.height) / 2) * 0.9;
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
}
