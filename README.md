---
theme: nico
highlight: an-old-hope
---

# 动动手你也能实现 ElementPlus Affix 固定组件

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

```javascript
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

```javascript
onMounted(() => {
  // 在这里我们只是实现base版本即根据视口固定，所以先取window为滚动容器，
  // 后面我们会更新逻辑
  scrollContainer.value = window
  // 更新root的信息
  updateRoot()
})
```

3. 使用 watchEffect/update 更新 fixed 的状态【根据 root 滚动时实时更新的位置信息来驱动】

```javascript
const update = () => {
  if (!scrollContainer.value) return
  // 这里可以看到，我们根据当目标元素root的位置信息top<0判断是否将离开窗口而进行fixed
  fixed.value = rootTop.value <= 0
}
watchEffect(update)
```

4. 设置元素的样式信息
   按照我们的 template 写法，我们要理解下，外部传入的 slot 内容最后是要 fixed 的，所以 div.affix-content 容器是为了当即将离开时对其设置 fixed 状态，而 div.affix 是为了当 div.affix-content 被 fixed 时，div.affix 是会坍缩的，如果不对其设置宽高，会导致滚动到 fixed 阶段时其他内容会有一个闪动 bug

```javascript
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

```css
.fixed {
  position: fixed;
}
```

## 新增 offset 参数

我们发现我们实现的 base 版本只是通过 rootTop.value <= 0 进行判断是否固定，而如果我想有一定的偏移量，还需要拓展以下,我们定义可从外部传入 offset

```javascript
 const props = withDefaults(
     defineProps<{
            offset?: number;
     }>(),
     { offset: 0 }
);
```

接着我们在 update 方法中将判断调整成以下逻辑，这样我们就可以达成根据传入的 offset 进行偏移了

```js
const update = () => {
  // ...
  fixed.value = props.offset >= rootTop.value
}
```

## 新增 position

基于之前的版本，我们只实现了滚动时目标元素固定到顶部，接下来我们按照 element-plus，加入 position 参数属性，让目标元素能够根据传入的 position:top|bottom 来进行定位

```javascript
const props = withDefaults(
  defineProps<{
    offset?: number;
    // 新增position参数
    position?: "top" | "bottom";
  }>(),
  { offset: 0, position: "top" }
);
```

我们跳转到 update 方法中，按照之前的写法，我们只是先 position=top 的逻辑，我们将其修改一下

```javascript
const update = () => {
  if (!scrollContainer.value) return
  if (props.position === 'top') {
    fixed.value = props.offset >= rootTop.value
  } else {
    // 解读：当目标元素的rootBottom(底部位置) > 窗口高度 - 目标元素偏移量
    fixed.value = windowHeight.value - props.offset < rootBottom.value
  }
}
```

与此同时在固定目标元素时，需要根据传入的 position=top|bottom 进而设置 affixStyle 的 top 或者 bottom

```javascript
const affixStyle =
  computed <
  CSSProperties >
  (() => {
    if (!fixed.value) return {}
    return {
      width: `${rootWidth.value}px`,
      height: `${rootHeight.value}px`,
      top: props.position === 'top' ? `${props.offset}px` : '',
      bottom: props.position === 'bottom' ? `${props.offset}px` : '',
    }
  })
```

这样就完成了 position 根据 top|bottom 的功能

## 新增 target

到目前为止以上的实现基本上能够满足基本需求，但有是有业务会希望目标元素在固定之后，在父容器(非滚动)从窗口即将消失时，目标元素也能够过渡恢复状态，基于这个需求，我们新增了 target：在指定父容器消失之后，其目标元素也希望跟着取消 fixed 状态。

开始我们的实现：

1. 定义 target[父容器的 css 选择器]⚠️ 非滚动容器

```javascript
const props = withDefaults(
  defineProps<{
    offset?: number;
    position?: "top" | "bottom";
    // 注意：target不可以为滚动容器
    target?: string;
  }>(),
  { offset: 0, position: "top", target: "" }
);
```

2. 在`onMounted`内通过 target 选择器去获取父容器

```javascript
onMounted(() => {
  //...省略部分代码
  if (props.target) {
    target.value =
      document.querySelector < HTMLElement > props.target ?? undefined
    if (!target.value) {
      throw new Error('Target is not existed')
    }
  } else {
    // 如果没有默认设置为document.documentElement
    target.value = document.documentElement
  }
})
```

3. 在 watchEffect/update 方法中，判断是否存在父容器，有则相应添加 fixed 逻辑

### 情况一：当 position 为 top

#### 1. fixed 判断 (有 target)

- props.offset - rootTop.value 的情况
- target(父容器)必须在可视窗口内，即 targetRect.bottom 如果小于 0 则意味着父容器从可视窗口消失，这是就要取消掉 fixed 状态

```javascript
const update = () => {
  // ...
  // 情况一：
  if (props.position === 'top') {
    // 存在target情况
    if (props.target) {
      const difference =
        // fixed判断
        (fixed.value =
          props.offset > rootTop.value && targetRect.bottom.value > 0)
    } else {
      // 不存在target的情况
      fixed.value = props.offset >= rootTop.value
    }
  } else {
    fixed.value = windowHeight.value - props.offset < rootBottom.value
  }
}
```

通过以上实现我们预览一下会发现，当父容器逐渐离开时，目标元素没有平滑过渡离开，显然我们还要实现如何达到过渡效果

![](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f70d568cd3834512abb769e8418c3a15~tplv-k3u1fbpfcp-watermark.image?)

#### 2. 目标元素过渡

还是上面的代码，我们在 fixed 判断下面添加过渡逻辑,其计算公式为 `父容器底部位置[动态] - 传入的偏移量[常量值] - 目标高度[常量值]`

```javascript
// 创建 transform变量用来平滑过度值的保存
const transform = ref(0)

const update = () => {
  // ...
  // 情况一：
  if (props.position === 'top') {
    if (props.target) {
      // fixed判断
      fixed.value = props.offset > rootTop.value && targetRect.bottom.value > 0
      // 父容器底部位置 - 传入的偏移量 - 目标高度
      // 父容器底部在滚动时位置是实时变化，即当每次滚动时他们的差值就是目标元素过渡值
      const difference =
        targetRect.bottom.value - props.offset - rootHeight.value
      // 保存平滑过渡值
      transform.value = difference < 0 ? difference : 0
    }
    // ...
  }
}
```

我们将保存的`transform`值设置到`affixStyle`中，这样我们就完成`position=top`且存在 target(父容器)的情况, 以下是实现效果

```javascript
const affixStyle =
  computed <
  CSSProperties >
  (() => {
    return {
      // ...
      transform: transform.value ? `translateY(${transform.value}px)` : '',
    }
  })
```

![gif.gif](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/cff8495f9788497aaafc0331fc33982e~tplv-k3u1fbpfcp-watermark.image?)

### 情况二：当 position 为 bottom

position:bottom 也是和 top 一样有两个判断

- windowHeight.value - props.offset < rootBottom.value 的情况
- target(父容器)必须在可视窗口内，即 targetRect.top 如果大于可视窗口高度(windowHeight) 则意味着父容器从可视窗口消失，这是就要取消掉 fixed 状态

#### 1. fixed 判断 (有 target)

```javascript
const update = () => {
  // ...
  if (props.position === 'top') {
    // 省略....
  } else if (props.target) {
    // 情况二：
    // position: bottom 有target
    // - 窗口高度-传入的偏移量<目标元素的底部位置 且 父容器顶部位置小于窗口高度时fixed
    fixed.value =
      windowHeight.value - props.offset < rootBottom.value &&
      windowHeight.value > targetRect.top.value
  } else {
    // position: bottom 不存在target的情况
    // 窗口高度 - 传入的偏移量 < 目标元素的底部位置
    fixed.value = windowHeight.value - props.offset < rootBottom.value
  }
}
```

#### 2. 目标元素过渡

底部的过渡计算公式为：`可视窗口高度[常量值] - 父容器顶部位置top[动态] - 传入的偏移量[常量值] - 目标元素的高度[常量值]`

```javascript
const update = () => {
  if (!scrollContainer.value) return

  if (props.position === 'top') {
    // 省略...
  } else if (props.target) {
    // 省略...
    const difference =
      windowHeight.value -
      targetRect.top.value -
      props.offset -
      rootHeight.value
    transform.value = difference < 0 ? -difference : 0
  }
  // 省略...
}
```

### 效果

![result.gif](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/fcb2bf4e2cb74b7681a69862928483f6~tplv-k3u1fbpfcp-watermark.image?)

### target 总结

我们总结一下我们在设置有无 target 的情况下的逻辑:

- **position: top 情况:**

  1.  **fixed 条件** :
      <br/>不存在`target`： `props.offset` > `rootTop.value` [偏移量 > 目标相对视口的顶部偏移 top]
      <br/>存在`target` ：`targetRect.bottom.value > 0` [基于第 1 点，加上 指定父容器底部`未`离开视口]
  2.  **目标元素平滑过渡** [只存在 target 情况]
      <br/>`difference`= `targetRect.bottom.value - props.offset - rootHeight.value` [父容器底部相对视口位置 - 目标偏移量 - 目标高度]

- **position: bottom 情况：**

  1. **fixed 条件**
     <br />不存在`target`：`windowHeight.value` - `props.offset` < `rootBottom.value` [当目标底部相对视口位置 < 视口高度 - 偏移量]
     <br/>存在`target`：`windowHeight.value > targetRect.top.value`[基于第一点，加上 指定父容器顶部`未`离开视口]


    2. **目标元素平滑过渡** [只存在target情况]
        <br />`difference`= `windowHeight.value - (rootHeight.value + props.offset + targetRect.top.value)` [视口高度 - (父容器顶部相对视口位置 + 偏移量 + 目标元素高度)]的绝对值



    现在我们就实现完 target 参数的设置啦
