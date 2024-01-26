/*
    Copyright (c) 2024 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { css } from "lit";

export default css`
    :host {
        box-sizing: border-box;
        display: block;
    }

    :host *,
    :host *::before,
    :host *::after {
        box-sizing: inherit;
    }

    [hidden] {
        display: none !important;
    }

    .elevated {
        --elevation-shadow-color: rgba(180, 180, 180, 0.3);
        box-shadow:
            -0.2rem -0.2rem 0.4rem rgba(180, 180, 180, 0.2),
            0.1rem 0.15rem 0.15rem var(--elevation-shadow-color),
            0.2rem 0.3rem 0.3rem var(--elevation-shadow-color);
    }
`;
