<script setup lang="ts">
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://vuejs.org/api/sfc-script-setup.html#script-setup
import { onMounted, shallowRef } from "vue";
import Affix from "./components/Affix.vue";
const handleChange = (res: any) => console.log("change", res);

const handleScroll = (res: any) => console.log("scroll", res);

const affixRef = shallowRef<InstanceType<typeof Affix> | null>(null);

onMounted(() => {
  console.log(affixRef.value?.update);
});
</script>

<template>
  <div>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <div
      id="parent"
      :style="{
        background: '#efefef',
        height: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }"
    >
      <Affix
        @change="handleChange"
        @scroll="handleScroll"
        :offset="80"
        position="top"
        target="#parent"
        ><div
          :style="{
            backgroundColor: '#27b627',
            padding: '10px',
            width: '150px',
            borderRadius: '8px',
          }"
        >
          position=<b>top</b> target="#parent"
        </div></Affix
      >
      <Affix ref="affixRef" :offset="80" position="bottom" target="#parent"
        ><div
          :style="{
            marginLeft: '10px',
            backgroundColor: '#8181d8',
            padding: '10px',
            width: '150px',
            borderRadius: '8px',
          }"
        >
          position=<b>bottom</b> target="#parent"
        </div></Affix
      >
    </div>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
    <p>这是一行文本</p>
  </div>
</template>
