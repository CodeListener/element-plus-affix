<template>
  <div class="affix" ref="root" :style="rootStyle">
    <div class="affix-content" :class="{ fixed }" :style="affixStyle">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  CSSProperties,
  onMounted,
  ref,
  shallowRef,
  watch,
  watchEffect,
} from "vue";
import {
  useElementBounding,
  useWindowSize,
  useEventListener,
} from "@vueuse/core";
import { getScrollContainer } from "./utils.js";

const props = withDefaults(
  defineProps<{
    offset?: number;
    position?: "top" | "bottom";
    zIndex: 100;
    // 注意：target不可以为滚动容器
    target?: string;
  }>(),
  { offset: 0, position: "top", target: "", zIndex: 100 }
);
const emit = defineEmits<{
  (event: "change", fixed: boolean): void;
  (event: "scroll", value: { scrollTop: number; fixed: boolean }): void;
}>();

const root = shallowRef<HTMLElement>();
const {
  height: rootHeight,
  width: rootWidth,
  top: rootTop,
  bottom: rootBottom,
  update: updateRoot,
} = useElementBounding(root);

//  指定父容器
const target = shallowRef<HTMLElement>();
// 指定父容器的位置/长宽信息
const targetRect = useElementBounding(target);
const transform = ref(0);
const scrollContainer = shallowRef<HTMLElement | Window>();
const { height: windowHeight } = useWindowSize();
const rootStyle = computed<CSSProperties>(() => {
  return {
    width: fixed.value ? `${rootWidth.value}px` : "",
    height: fixed.value ? `${rootHeight.value}px` : "",
  };
});
const affixStyle = computed<CSSProperties>(() => {
  if (!fixed.value) return {};
  return {
    width: `${rootWidth.value}px`,
    height: `${rootHeight.value}px`,
    top: props.position === "top" ? `${props.offset}px` : "",
    bottom: props.position === "bottom" ? `${props.offset}px` : "",
    transform: transform.value ? `translateY(${transform.value}px)` : "",
    zIndex: props.zIndex,
  };
});

const fixed = ref(false);

const update = () => {
  if (!scrollContainer.value) return;
  if (props.position === "top") {
    if (props.target) {
      const difference =
        targetRect.bottom.value - props.offset - rootHeight.value;
      transform.value = difference < 0 ? difference : 0;

      fixed.value = props.offset > rootTop.value && targetRect.bottom.value > 0;
    } else {
      fixed.value = props.offset >= rootTop.value;
    }
  } else if (props.target) {
    fixed.value =
      windowHeight.value - props.offset < rootBottom.value &&
      windowHeight.value > targetRect.top.value;

    const difference =
      windowHeight.value -
      targetRect.top.value -
      props.offset -
      rootHeight.value;

    transform.value = difference < 0 ? -difference : 0;
  } else {
    fixed.value = windowHeight.value - props.offset < rootBottom.value;
  }
};

const handleScroll = () => {
  const scrollTop =
    scrollContainer.value instanceof Window
      ? document.documentElement.scrollTop
      : scrollContainer.value?.scrollTop;
  emit("scroll", { fixed: fixed.value, scrollTop: scrollTop || 0 });
};

watch(fixed, (v) => emit("change", v));

onMounted(() => {
  scrollContainer.value = getScrollContainer(root.value!, true);

  if (props.target) {
    target.value =
      document.querySelector<HTMLElement>(props.target) ?? undefined;
    if (!target.value) {
      throw new Error("Target is not existed");
    }
  } else {
    // 如果没有默认设置为document.documentElement
    target.value = document.documentElement;
  }
  updateRoot();
});

useEventListener(scrollContainer, "scroll", handleScroll);
watchEffect(update);

defineExpose({
  update,
});
</script>
<style scoped>
.fixed {
  position: fixed;
}
</style>
