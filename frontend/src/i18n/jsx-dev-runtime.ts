import { jsxDEV as reactJsxDEV } from "react/jsx-dev-runtime";
import { LocalizedElement, needsLocalization } from "./localized-element";
export { Fragment } from "react/jsx-dev-runtime";
export type { JSX } from "react";
export const jsxDEV: typeof reactJsxDEV = (
  type,
  props,
  key,
  isStaticChildren,
  source,
  self,
) =>
  needsLocalization(type, (props ?? {}) as Record<string, unknown>)
    ? reactJsxDEV(
        LocalizedElement,
        { elementType: type, elementProps: props },
        key,
        false,
        source,
        self,
      )
    : reactJsxDEV(type, props, key, isStaticChildren, source, self);
