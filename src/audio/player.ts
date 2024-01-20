/*
    Copyright (c) 2024 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { CustomElement, attribute, css, html } from "../base/web-components";
import { AudioContextManager } from "./context-manager";
import { WinterAudioOscilloscopeElement } from "./oscilloscope";

/**
 * Audio player element with oscilloscope view
 */
export class WinterAudioPlayerElement extends CustomElement {
    private static instances: Set<WinterAudioPlayerElement> = new Set();

    static override styles = [
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
        `,
    ];

    private audio: HTMLAudioElement;
    private audioSourceNode: MediaElementAudioSourceNode;
    private oscilloscope: WinterAudioOscilloscopeElement;

    @attribute({ type: String })
    src: string;

    @attribute({ type: Boolean })
    loop: boolean;

    public get currentTime() {
        return this.audio?.currentTime;
    }

    public set currentTime(value: number) {
        this.audio.currentTime = value;
    }

    public get duration() {
        return this.audio?.duration;
    }

    public get ended() {
        return this.audio?.ended;
    }

    public get networkState() {
        return this.audio?.networkState;
    }

    public get paused() {
        return this.audio?.paused;
    }

    public get readyState() {
        return this.audio?.readyState;
    }

    public get volume() {
        return this.audio?.volume;
    }

    public set volume(value: number) {
        this.audio.volume = value;
    }

    public play() {
        this.audio?.play();
    }

    public pause() {
        this.audio?.pause();
    }

    private pauseOthers() {
        const staticThis = this.constructor as typeof WinterAudioPlayerElement;
        for (const instance of staticThis.instances) {
            if (instance !== this) {
                instance.pause();
            }
        }
    }

    private connectSource() {
        const manager = AudioContextManager.instance;

        if (!this.audioSourceNode) {
            this.audioSourceNode = manager.createSource(this.audio);
        }

        manager.activeSource = this.audioSourceNode;
    }

    private onAudioPlay() {
        this.pauseOthers();
        this.connectSource();
        this.oscilloscope.start();
    }

    private onAudioPauseOrEnd() {
        this.oscilloscope.stop();
    }

    override connectedCallback(): void | undefined {
        super.connectedCallback();
        const staticThis = this.constructor as typeof WinterAudioPlayerElement;
        staticThis.instances.add(this);
    }

    override disconnectedCallback(): void | undefined {
        super.disconnectedCallback();
        const staticThis = this.constructor as typeof WinterAudioPlayerElement;
        staticThis.instances.delete(this);
    }

    override render() {
        let sources: NodeListOf<HTMLElement> | HTMLElement =
            this.querySelectorAll("source");

        if (!sources.length) {
            sources = html`<source src="${this.src}" />` as HTMLElement;
        }

        this.audio = html`<audio
            controls
            crossorigin="anonymous"
            loop="${this.loop}"
            title="${this.title}">
            ${sources}
        </audio>` as HTMLAudioElement;

        this.audio.addEventListener("play", () => {
            this.onAudioPlay();
        });

        this.audio.addEventListener("pause", () => {
            this.onAudioPauseOrEnd();
        });

        this.audio.addEventListener("ended", () => {
            this.onAudioPauseOrEnd();
        });

        this.oscilloscope =
            html`<winter-audio-oscilloscope></winter-audio-oscilloscope>` as WinterAudioOscilloscopeElement;

        return html` ${this.oscilloscope} ${this.audio}
            <p>${this.title}</p>`;
    }
}

window.customElements.define("winter-audio-player", WinterAudioPlayerElement);