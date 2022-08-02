import { camelize, CSSProperties } from "vue";

export function getScrollContainer(
  el: HTMLElement,
  isVertical?: boolean
): Window | HTMLElement | undefined {
  let parent: HTMLElement = el;
  while (parent) {
    if ([window, document, document.documentElement].includes(parent)) {
      return window;
    }
    if (isScroll(parent, isVertical)) return parent;
    parent = parent.parentNode as HTMLElement;
  }
  return parent;
}

export function isScroll(el: HTMLElement, isVertical?: boolean): boolean {
  const key = (
    {
      undefined: "overflow",
      true: "overflow-y",
      false: "overflow-x",
    } as const
  )[String(isVertical)]!;
  const overflow = getStyle(el, key);
  return ["scroll", "auto", "overlay"].some((s) => overflow.includes(s));
}

export function getStyle(
  element: HTMLElement,
  styleName: keyof CSSProperties
): string {
  if (!element || !styleName) return "";

  let key = camelize(styleName);
  if (key === "float") key = "cssFloat";
  try {
    const style = (element.style as any)[key];
    if (style) return style;
    const computed: any = document.defaultView?.getComputedStyle(element, "");
    return computed ? computed[key] : "";
  } catch {
    return (element.style as any)[key];
  }
}
