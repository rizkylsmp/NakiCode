import { jsx as reactJsx, jsxs as reactJsxs } from "react/jsx-runtime";
import { LocalizedElement, needsLocalization } from "./localized-element";
export { Fragment } from "react/jsx-runtime";
export type { JSX } from "react";

export const jsx: typeof reactJsx = (type, props, key) =>
  needsLocalization(type, (props ?? {}) as Record<string, unknown>)
    ? reactJsx(
        LocalizedElement,
        { elementType: type, elementProps: props },
        key,
      )
    : reactJsx(type, props, key);
export const jsxs: typeof reactJsxs = (type, props, key) =>
  needsLocalization(type, (props ?? {}) as Record<string, unknown>)
    ? reactJsxs(
        LocalizedElement,
        { elementType: type, elementProps: props },
        key,
      )
    : reactJsxs(type, props, key);
