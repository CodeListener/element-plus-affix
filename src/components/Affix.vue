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
    zIndex?: number;
  }>(),
  { offset: 0, position: "top", zIndex: 100 }
);
const root = shallowRef<HTMLElement>();
const {
  height: rootHeight,
  width: rootWidth,
  top: rootTop,
  bottom: rootBottom,
  update: updateRoot,
} = useElementBounding(root);
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
    zIndex: props.zIndex,
  };
});

const fixed = ref(false);

const update = () => {
  if (!scrollContainer.value) return;
  if (props.position === "top") {
    fixed.value = props.offset >= rootTop.value;
  } else {
    fixed.value = windowHeight.value - props.offset < rootBottom.value;
  }
};

onMounted(() => {
  scrollContainer.value = window;
  updateRoot();
});
watchEffect(update);
</script>
<style scoped>
.fixed {
  position: fixed;
}
</style>
