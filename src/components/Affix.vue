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
import { useElementBounding } from "@vueuse/core";

const props = withDefaults(
  defineProps<{
    offset?: number;
  }>(),
  { offset: 0 }
);
const root = shallowRef<HTMLLegendElement>();
const {
  height: rootHeight,
  width: rootWidth,
  top: rootTop,
  bottom: rootBottom,
  update: updateRoot,
} = useElementBounding(root);
const scrollContainer = shallowRef<HTMLElement | Window>();

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
    top: `${props.offset}px`,
  };
});

const fixed = ref(false);

const update = () => {
  if (!scrollContainer.value) return;
  fixed.value = props.offset >= rootTop.value;
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
