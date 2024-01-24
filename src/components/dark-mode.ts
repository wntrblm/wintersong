/*
    Copyright (c) 2024 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { prefersDarkScheme } from "../base/media-queries";
import "./icon";
import baseStyles from "./styles";

/**
 * Light/dark mode switcher
 */
@customElement("winter-dark-mode")
export class WinterDarkModeElement extends LitElement {
    static override styles = [
        baseStyles,
        css`
            :host {
                position: fixed;
                bottom: 1rem;
                right: 1rem;
            }

            button {
                color: var(--text-color, black);
                text-shadow: 0 0 0.5em var(--text-color, black);
                background: none;
                border: none;
            }

            button:hover {
                --text-color: var(--color-alt-cyan-3, cyan);
                cursor: pointer;
            }

            winter-icon {
                font-size: 3em;
            }
        `,
    ];

    override connectedCallback(): void {
        super.connectedCallback();

        const mediaPrefersDark = prefersDarkScheme.matches;
        const storedPreference = window.localStorage.getItem("color-scheme");
        let useDark =
            storedPreference === "dark" ||
            (storedPreference !== "light" && mediaPrefersDark);

        if (useDark) {
            document.documentElement.classList.add("dark");
        }
    }

    private onClick(e: MouseEvent) {
        if (document.documentElement.classList.contains("dark")) {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("color-scheme", "light");
        } else {
            document.documentElement.classList.add("dark");
            localStorage.setItem("color-scheme", "dark");
        }
    }

    override render() {
        return html`
            <button
                @click=${this.onClick}
                type="button"
                aria-label="switch between dark and light mode">
                <winter-icon>dark_mode</winter-icon>
            </button>
        `;
    }
}
