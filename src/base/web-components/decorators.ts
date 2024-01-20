/*
    Copyright (c) 2022 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { noop, preventConcurrentCalls } from "../functions";
import { camelToDash } from "../strings";

export function attribute<Type = unknown, TypeHint = unknown>(options: {
    type: TypeHint;
    converter?: AttributeConverter<Type, TypeHint>;
    onChange?: (oldValue: Type | null, newValue: Type | null) => void;
}) {
    const to =
        options.converter?.toAttribute ?? defaultAttributeConverter.toAttribute;
    const from =
        options.converter?.fromAttribute ??
        defaultAttributeConverter.fromAttribute;
    const wrappedOnChange = preventConcurrentCalls(options.onChange ?? noop);

    return (target: object, propertyKey: string | symbol): void => {
        const attributeKey = camelToDash(propertyKey as string);

        Object.defineProperty(target, propertyKey, {
            enumerable: true,
            configurable: true,
            get() {
                return from(this.getAttribute(attributeKey), options.type);
            },
            set(value: Type) {
                const old = this[propertyKey];

                const converted = to(value, options.type);

                if (converted === null) {
                    this.removeAttribute(attributeKey);
                } else {
                    this.setAttribute(attributeKey, converted);
                }

                wrappedOnChange(old, value);
            },
        });
    };
}

interface AttributeConverter<Type = unknown, TypeHint = unknown> {
    toAttribute(value: Type, type?: TypeHint): unknown;
    fromAttribute(value: string | null, type?: TypeHint): Type;
}

const defaultAttributeConverter = {
    toAttribute(value: unknown, type?: unknown): string | null {
        if (value === null) {
            return value;
        }

        switch (type) {
            case Boolean:
                return value ? "" : null;
            case String:
                return value as string;
            case Number:
                return `${value}`;
            default:
                throw new Error(
                    `Can not convert type "${type}" and value "${value} to attribute`,
                );
        }
    },
    fromAttribute(value: string | null, type?: unknown): unknown {
        switch (type) {
            case Boolean:
                return value !== null;
            case String:
                return value;
            case Number:
                return value === null ? null : Number(value);
            default:
                throw new Error(
                    `Can not convert type "${type}" and value "${value} to attribute`,
                );
        }
    },
};

export function query(selector: string, cache?: boolean) {
    return (target: object, propertyKey: string | symbol): void => {
        const cacheKey =
            typeof propertyKey === "symbol" ? Symbol() : `__${propertyKey}`;

        Object.defineProperty(target, propertyKey, {
            enumerable: true,
            configurable: true,
            get() {
                const thisAsRecord = this as unknown as {
                    [key: string | symbol]: Element | null;
                };

                if (cache && thisAsRecord[cacheKey] !== undefined) {
                    return thisAsRecord[cacheKey];
                }

                const result = this.renderRoot?.querySelector(selector) ?? null;

                if (cache && result) {
                    thisAsRecord[cacheKey] = result;
                }

                return result;
            },
        });
    };
}

export function queryAll(selector: string) {
    return (target: object, propertyKey: string | symbol): void => {
        Object.defineProperty(target, propertyKey, {
            enumerable: true,
            configurable: true,
            get() {
                return this.renderRoot?.querySelectorAll(selector) ?? [];
            },
        });
    };
}

export function queryAssignedElements(selector?: string, slot?: string) {
    return (target: object, propertyKey: string | symbol): void => {
        Object.defineProperty(target, propertyKey, {
            enumerable: true,
            configurable: true,
            get(): HTMLElement[] {
                return this.queryAssignedElements(selector, slot);
            },
        });
    };
}
