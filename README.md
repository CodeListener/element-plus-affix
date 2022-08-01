---
theme: nico
highlight: an-old-hope
---
# ElementPlus Affix 源码解析

> 最近稍微比较有空，突然想到过往开发的业务中对于类似`Element-Plus 的 Affix`的逻辑很少进行封装，起兴看了下`Element-Plus Affix`的源码进行学习，以下是对`Affix`组件进行解析，觉得有兴趣的`JYM`建议开个项目一起动起来，（PS: 文中的 vue api 就不进行讲解了，想必大佬们都看过`vue官方文档了`）

## 属性列表

以下是官方提供的属性列表，在这里我们着重讲解`offset, position, target`三个参数在在整个组件中使用

| 名称       | 说明                  | 类型                | 默认值  | 必填项 |
| ---------- | --------------------- | ------------------- | ------- | ------ |
| `offset`   | 偏移距离              | `number`            | `0`     | No     |
| `position` | 位置                  | `'top' \| 'bottom'` | `'top'` | No     |
| `target`   | 指定容器 (CSS 选择器) | `string`            | —       | No     |
| `z-index`  | `z-index`             | `number`            | `100`   | No     |

## 核心点

> Affix 是通过滚动时对目标元素进行判断是否即将离开可视区域，当即将离开可视区域时对目标元素进行 fixed，那接下来我们先实现一个基础版本

<!-- 使用过`Affix`组件的都知道如果设置了target父容器之后，效果和不设置的稍微有点不同：只有当父容器在可视区域的时候，父容器内部的Affix元素才会进行fixed，当父容器离开视口恢复到默认，那我们就从是否有target进行分析 -->

> Tip: 为了能够尽可能缩短代码量，本文代码对导入的代码进行了忽略，同时我们使用到了@vueuse/core 包的部分 API，优先将安装包安装好

使用到@vueuse/core 的 api （由于作者几乎没看过 vueuse，也是通过 element-plus 才去看下，如果理解有误还望原谅）

```
    pnpm i @vueuse/core
```

- useElementBounding [获取元素的位置和长宽信息]
- useWindowSize [获取窗口的宽高信息]
- useEventListener [注册时间监听]

## Base 版本

<!-- 我们先创建 affix 的 template，可以简单思考为什么这么实现 -->

### template

```html
<template>
  <div class="affix" ref="root" :style="rootStyle">
    <div class="affix-content" :class="{ fixed }" :style="affixStyle">
      <slot></slot>
    </div>
  </div>
</template>
```

### script

逻辑分为以下几个步骤

1. 定义获取目标元素及其元素信息，滚动容器, fixed 状态
``` javascript
   import { useElementBounding } from "@vueuse/core";
   // 目标元素信息
   const root = shallowRef<HTMLElement>();
   const fixed = ref(false)
   const {
    height: rootHeight,
    width: rootWidth,
    top: rootTop,
    bottom: rootBottom,
    update: updateRoot,
    } = useElementBounding(root);
   // 滚动容器
   const scrollContainer = shallowRef<HTMLElement | Window>();
```

2. onMounted 阶段设置 scrollContainer 滚动容器，更新 root 的信息
``` javascript
onMounted(() => {
  // 在这里我们只是实现base版本即根据视口固定，所以先取window为滚动容器，
  // 后面我们会更新逻辑
  scrollContainer.value = window
  // 更新root的信息
  updateRoot()
})
```
3. 使用 watchEffect/update 更新 fixed 的状态【根据 root 滚动时实时更新的位置信息来驱动】
``` javascript
const update = () => {
  if (!scrollContainer.value) return
  // 这里可以看到，我们根据当目标元素root的位置信息top<0判断是否将离开窗口而进行fixed
  fixed.value = props.offset >= rootTop.value
}
watchEffect(update)
```
4. 设置元素的样式信息
   按照我们的 template 写法，我们要理解下，外部传入的 slot 内容最后是要 fixed 的，所以 div.affix-content 容器是为了当即将离开时对其设置 fixed 状态，而 div.affix 是为了当 div.affix-content 被 fixed 时，div.affix 是会坍缩的，如果不对其设置宽高，会导致滚动到 fixed 阶段时其他内容会有一个闪动 bug
``` javascript
const rootStyle =
  computed <
  CSSProperties >
  (() => {
    return {
      width: fixed.value ? `${rootWidth.value}px` : '',
      height: fixed.value ? `${rootHeight.value}px` : '',
    }
  })
const affixStyle =
  computed <
  CSSProperties >
  (() => {
    if (!fixed.value) return {}
    return {
      width: `${rootWidth.value}px`,
      height: `${rootHeight.value}px`,
      top: `${props.offset}px`,
    }
  })
```
### css
``` css
.fixed {
  position: fixed;
}
```

## 新增offset 参数

我们发现我们实现的 base 版本只是通过 rootTop.value <= 0 进行判断是否固定，而如果我想有一定的偏移量，还需要拓展以下,我们定义可从外部传入 offset

``` javascript
 const props = withDefaults(
     defineProps<{
            offset?: number;
     }>(),
     { offset: 0 }
);
```

接着我们在 update 方法中将判断调整成以下逻辑，这样我们就可以达成根据传入的offset进行偏移了

``` js
const update = () => {
    // ...
    fixed.value = props.offset >= rootTop.value
}
```
}
