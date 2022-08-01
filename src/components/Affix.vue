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
  watchEffect,
} from "vue";
import { useElementBounding, useWindowSize } from "@vueuse/core";

const props = withDefaults(
  defineProps<{
    offset?: number;
    position?: "top" | "bottom";
    // 注意：target不可以为滚动容器
    target?: string;
  }>(),
  { offset: 0, position: "top", target: "" }
);
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

onMounted(() => {
  scrollContainer.value = window;
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
watchEffect(update);
</script>
<style scoped>
.fixed {
  position: fixed;
}
</style>
