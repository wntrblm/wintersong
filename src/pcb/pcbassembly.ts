/*
    Copyright (c) 2021 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { $$ } from "../base/dom.js";
import { html } from "../base/web-components/html.js";
import { Renderer } from "./pcbrender.js";

async function fetch_pcb_data(path: string) {
    const request = new Request(path, {
        method: "GET",
    });

    const response = await fetch(request);

    return await response.json();
}

function extract_bom(pcb_data: {
    bom: { F: any; both: any; fields: { [x: string]: any } };
}) {
    const items = [];
    const front_items = [];

    for (const group of pcb_data.bom.F) {
        for (const [ref, _] of group) {
            front_items.push(ref);
        }
    }

    for (const group of pcb_data.bom.both) {
        for (const [ref, index] of group) {
            const fields = pcb_data.bom.fields[index];
            items.push({
                ref: ref,
                value: fields[0],
                footprint: fields[1],
                show: fields[2] ? true : false,
                side: front_items.includes(ref) ? "Front" : "Back",
            });
        }
    }

    return items;
}

function filter_bom(bom: any[]) {
    return bom.filter((item: { show: any }) => item.show);
}

function filter_bom_pin_one_highlights(bom: any[]) {
    return bom.filter(
        (item: { ref: string }) =>
            item.ref.startsWith("D") ||
            item.ref.startsWith("U") ||
            item.ref.startsWith("CP"),
    );
}

interface Item {
    ref: string;
    value: string;
    side: string;
    [key: string]: string;
}

function group_bom(bom: Item[]) {
    const front_by_value: Record<string, Item[]> = {};
    const back_by_value: Record<string, Item[]> = {};
    for (const item of bom) {
        let dest = item.side === "Front" ? front_by_value : back_by_value;
        if (dest[item.value] === undefined) {
            dest[item.value] = [];
        }
        dest[item.value]!.push(item);
    }
    return {
        front: front_by_value,
        back: back_by_value,
    };
}

function grouped_bom_to_rows(bom: Record<string, Item[]>) {
    const rows = [];
    for (const [value, items] of Object.entries(bom)) {
        rows.push({
            refs: items.map((x) => x.ref).join(", "),
            value: value,
        });
    }
    return rows;
}

class BOMTable {
    renderer: Renderer;
    items: { refs: any; value: string }[];

    constructor(items: { refs: any; value: string }[], renderer: Renderer) {
        this.items = items;
        this.renderer = renderer;
    }

    row_for_item(idx: number, bom_item: { refs: any; value: any }) {
        const checkbox = html`<input
            type="checkbox"
            class="checkbox"
            aria-label="Mark row ${idx + 1} complete" />` as HTMLInputElement;
        const cells = [bom_item.refs, bom_item.value];
        const cell_elems = [html`<td>${checkbox}</td>`];
        for (const cell of cells) {
            cell_elems.push(html`<td>${cell}</td>`);
        }
        const tr = html`<tr data-bom-idx="${idx}">
            ${cell_elems}
        </tr>` as HTMLTableRowElement;

        checkbox.addEventListener("click", () => {
            if (checkbox.checked) {
                tr.classList.add("complete");
            } else {
                tr.classList.remove("complete");
            }
        });

        return tr;
    }

    make() {
        const header_elems: HTMLElement[] = [];

        for (const [header, label] of [
            ["", "Completed"],
            ["Reference", "Component references"],
            ["Value", "Component values"],
        ]) {
            let elem;
            if (header) {
                elem = html`<th aria-label="${label}">${header}</th>`;
            } else {
                elem = html`<td aria-label="${label}">${header}</td>`;
            }
            header_elems.push(elem as HTMLElement);
        }

        const row_elems = this.items.map((item: any, idx: any) =>
            this.row_for_item(idx, item),
        );

        const table = html`<table
            class="bom-table"
            aria-label="Table of components">
            <thead>
                ${header_elems}
            </thead>
            <tbody>
                ${row_elems}
            </tbody>
        </table>` as HTMLTableElement;

        table.addEventListener("click", (ev) => {
            const row = (ev.target! as HTMLElement).closest(
                "tr[data-bom-idx]",
            ) as HTMLElement;
            if (!row) {
                return;
            }
            this.highlight_row_items(row);
        });

        row_elems[0]?.click();

        return table;
    }

    highlight_row_items(row: HTMLElement) {
        const item = this.items[parseInt(row.dataset["bomIdx"]!, 10)];

        if (!item) {
            return;
        }

        this.renderer.highlight(
            item.refs.split(",").map((x: string) => x.trim()),
        );

        for (const tr of $$(row.parentElement!, "tr")) {
            tr.classList.remove("active");
        }
        row.classList.add("active");
    }
}

async function init(elem: HTMLElement) {
    const pcb_data = await fetch_pcb_data(elem.dataset["pcbAssembly"]!);
    const bom = filter_bom(extract_bom(pcb_data));
    const grouped_bom = group_bom(bom);
    const front_bom_rows = grouped_bom_to_rows(grouped_bom.front);
    const back_bom_rows = grouped_bom_to_rows(grouped_bom.back);

    const r = new Renderer(elem, pcb_data);
    r.highlightPinOne(
        filter_bom_pin_one_highlights(bom).map((v: { ref: any }) => v.ref),
    );

    const front_table = new BOMTable(front_bom_rows, r);
    r.front.canvas.after(front_table.make());
    const back_table = new BOMTable(back_bom_rows, r);
    r.back.canvas.after(back_table.make());
}

for (const elem of $$("[data-pcb-assembly]")) {
    init(elem);
}
