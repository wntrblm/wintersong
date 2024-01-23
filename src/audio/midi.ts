/*
    Copyright (c) 2024 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

export class MIDI {
    input: MIDIInput;
    output: MIDIOutput;

    constructor(public portName: string) {}

    async connect() {
        let access = await navigator.requestMIDIAccess({ sysex: true });

        for (const port of access.inputs.values()) {
            if (port.name === this.portName) {
                this.input = port;
            }
        }
        for (const port of access.outputs.values()) {
            if (port.name === this.portName) {
                this.output = port;
            }
        }

        if (this.input == undefined || this.output == undefined) {
            throw `Unable to connect to ${this.portName}`;
        }
    }

    send(data: Uint8Array) {
        this.output.send(data);
    }

    async receive() {
        const done = new Promise<MIDIMessageEvent>((resolve) => {
            this.input.onmidimessage = function (msg) {
                resolve(msg as MIDIMessageEvent);
            };
        });

        return await done;
    }

    async transact(data: Uint8Array) {
        const done = new Promise<MIDIMessageEvent>((resolve) => {
            this.input.onmidimessage = function (msg) {
                resolve(msg as MIDIMessageEvent);
            };
            this.output.send(data);
        });

        return await done;
    }
}
