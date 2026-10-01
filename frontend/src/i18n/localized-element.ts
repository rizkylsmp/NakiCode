import {
  Children,
  createContext,
  useContext,
  createElement,
  type ElementType,
  type ReactNode,
} from "react";
import { translateText, useLanguage, type Language } from "./language";

const textAttributes = [
  "title",
  "alt",
  "placeholder",
  "aria-label",
  "aria-description",
];
const UntranslatedScope = createContext(false);
function translateChildren(value: ReactNode, language: Language): ReactNode {
  if (typeof value === "string") return translateText(value, language);
  if (Array.isArray(value))
    return Children.map(value, (item) => translateChildren(item, language));
  return value;
}

/** Translate only display text, never input values, URLs, IDs or business payloads. */
export function LocalizedElement({
  elementType,
  elementProps,
}: {
  elementType: ElementType;
  elementProps: Record<string, unknown>;
}) {
  const { language, enabled } = useLanguage();
  const inherited = useContext(UntranslatedScope);
  const preserve =
    inherited ||
    elementProps.translate === "no" ||
    Boolean(elementProps["data-no-translate"]);
  const props = { ...elementProps };
  if (enabled && !preserve && elementType !== "textarea")
    props.children = translateChildren(props.children as ReactNode, language);
  else if (Array.isArray(props.children))
    props.children = Children.toArray(props.children as ReactNode);
  for (const attribute of textAttributes) {
    if (enabled && !preserve && typeof props[attribute] === "string")
      props[attribute] = translateText(props[attribute], language);
  }
  // Options without explicit values must keep their original submission value.
  if (
    elementType === "option" &&
    props.value === undefined &&
    typeof elementProps.children === "string"
  )
    props.value = elementProps.children;
  const children = props.children as ReactNode;
  delete props.children;
  // Static siblings are variadic children, not an unkeyed dynamic list.
  const element = Array.isArray(children)
    ? createElement(elementType, props, ...children)
    : createElement(elementType, props, children);
  return preserve && !inherited
    ? createElement(UntranslatedScope.Provider, { value: true }, element)
    : element;
}

export function needsLocalization(
  type: unknown,
  props: Record<string, unknown>,
) {
  if (
    typeof type === "string" &&
    ["script", "style", "title", "code", "pre", "meta", "link"].includes(type)
  )
    return false;
  if (props.translate === "no" || props["data-no-translate"]) return true;
  const children = props.children;
  return (
    typeof children === "string" ||
    (Array.isArray(children) &&
      children.some((child) => typeof child === "string")) ||
    textAttributes.some((name) => typeof props[name] === "string")
  );
}
