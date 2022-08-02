---
theme: orange
highlight: androidstudio
---
# 动动手你也能实现 ElementPlus Affix 固钉组件

> 最近稍微比较有空，突然想到过往开发的业务中对于类似`Element-Plus 的 Affix`的逻辑很少进行封装，起兴看了下`Element-Plus Affix`的源码进行学习，以下是对`Affix`组件进行解析并逐步实现，觉得有兴趣的`JYM`建议开个项目一起动起来<br/><br/>Tip: 文中的 vue api 就不进行讲解了，想必大佬们都看过`vue官方文档了`

通过本文章的逐步实现，希望你能够了解到：
1. 如何通过`Vue3` + `VueUse` 实现一个`Affix`固钉组件
2. 看懂element-plus affix组件代码 

## 什么是Affix固钉

> Affix 是通过滚动时对目标元素进行判断是否即将离开可视区域，当即将离开可视区域时将目标元素固定在特定可视区域

## 属性列表

以下是`element-plus`官方提供的属性列表，在这里我们着重讲解`offset, position, target`三个参数在在整个组件中的实现

| 名称       | 说明                  | 类型                | 默认值  |
| ---------- | --------------------- | ------------------- | ------- | 
| `offset`   | 偏移距离              | `number`            | `0`     |
| `position` | 位置                  | `top \| bottom` | `top` | 
| `target`   | 指定容器 (CSS 选择器) | `string`            | —       |
| `z-index`  | `z-index`             | `number`            | `100`  |


Tip: 每个阶段的实现都会在我提交的github的不同分支，可以切换分支[查看代码](https://github.com/CodeListener/element-plus-affix)

本功能使用到`@vueuse/core`的`api`
```
pnpm i @vueuse/core
```
- useElementBounding [获取元素的位置和长宽信息]
- useWindowSize [获取窗口的宽高信息]
- useEventListener [注册事件监听]

## 基础版本
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

整体大致逻辑分为以下步骤

一. 定义获取`目标元素`及其`目标元素信息`，`滚动容器`,`fixed`状态

```javascript
import { useElementBounding } from "@vueuse/core";
// 目标元素
const root = shallowRef<HTMLElement>();
const fixed = ref(false)
// 目标元素信息
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

二. `onMounted`阶段设置`scrollContainer`滚动容器，更新`root目标元素`的信息
```javascript
onMounted(() => {
    // 我们先以window作为滚动容器
    scrollContainer.value = window
    // 更新root的信息
    updateRoot()
})
```
三. 使用 `watchEffect(update)` 更新`fixed`的状态(**通过依赖目标元素rootTop变更，对fixed状态进行设置**)
```javascript
const update = () => {
    if (!scrollContainer.value) return
    // 这里可以看到，我们根据当目标元素root的位置信息top < 0 判断是否将离开窗口而进行fixed
    fixed.value = rootTop.value <= 0
}
watchEffect(update)
```
四. 设置元素的样式信息
按照我们的`template`写法，我们要理解下几点内容：
1. 外部传入的`slot`内容最后时，作为fixed的内容通过`div.affix-content`进行包裹使得`<slot />`能够脱离文档流
2. `div.affix`是为了当 `div.affix-content`被`fixed`时，`div.affix`依然没有脱离文档流，但因为`div.affix-content`的脱离文档会导致是会坍缩，所以需要对`div.affix`设置宽高会保证滚动到 `fixed`阶段时其他内容不会有**闪动bug**

```typescript
const rootStyle = computed<CSSProperties>(() => {
    return {
        width: fixed.value ? `${rootWidth.value}px` : '',
        height: fixed.value ? `${rootHeight.value}px` : '',
    }
})
const affixStyle = computed<CSSProperties>(() => {
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
完成之后你就可以运行一个基础版本的affix，但想必这功能还不够，只能将其紧贴着页面顶部，接下来我们继续趁热打铁，追加`offset`参数

## 参数
### ✨ offset参数

我们发现实现的基础版本只是通过`rootTop.value <= 0`进行判断是否固定，而如果想有一定的偏移量，还需要拓展一下,接下来我们定义可从外部传入`offset`

```typescript
const props = withDefaults(defineProps<{
    offset?: number;
}>(),
    { offset: 0 }
);
```
目前我们的`update`方法中固定写死了`fixed.value=rootTop <= 0`的逻辑，现在我们调整一下逻辑：
```js
const update = () => {
    // - fixed.value = rootTop.value <= 0
    // 更新成下面的代码
    fixed.value = props.offset >= rootTop.value
}
```
以上就完成了基础版本+`offset`参数的实现，具体代码可以查看 [**base-offset分支**](https://github.com/CodeListener/element-plus-affix/tree/base-offset)

### ✨ position参数
基于之前的版本我们发现只实现了滚动时目标元素固定到顶部，接下来加入 `position`参数属性让目标元素能够根据传入的`position= top | bottom`来进行定位`顶部固定`或者`底部固定`

```typescript
const props = withDefaults(defineProps<{
    offset?: number;
    // 新增position参数
    position?: "top" | "bottom";
}>(),
    { offset: 0, position: "top" }
);
```
回到`update`方法中按照之前的写法，我们只是写了`position=top`的逻辑，继续追加`position=bottom`的逻辑

```typescript
const update = () => {
    if (!scrollContainer.value) return
    if (props.position === 'top') {
        fixed.value = props.offset >= rootTop.value
    } else {
        // position: bottom情况
        // 当目标元素的rootBottom(底部位置) > 窗口高度 - 目标元素偏移量
        fixed.value = windowHeight.value - props.offset < rootBottom.value
    }
}
```
与此同时在`affixStyle`根据传入的`position=bottom`对其`bottom`进行设置

``` typescript
const affixStyle = computed<CSSProperties>(() => {
    if (!fixed.value) return {}
    return {
        width: `${rootWidth.value}px`,
        height: `${rootHeight.value}px`,
        top: props.position === 'top' ? `${props.offset}px` : '',
        bottom: props.position === 'bottom' ? `${props.offset}px` : '',
    }
})
```
这样就完成了`position`根据`top | bottom`固定功能，具体代码可以查看 [**feat-position分支**](https://github.com/CodeListener/element-plus-affix/tree/feat-position)

### ✨ target参数

到目前为止的实现基本上能够满足基本需求，但有是有业务会希望目标元素在固定之后，在父容器(**⚠非滚动**)从窗口即将消失时，目标元素也能够过渡恢复状态，基于这个需求，我们新增`target：在指定父容器消失之后，其目标元素也希望跟着取消 fixed 状态`。

开始我们的实现：

1. 定义 `target`（**父容器的css选择器**）⚠ **非滚动容器**

```typescript
const props = withDefaults(defineProps<{
    offset?: number;
    position?: "top" | "bottom";
    // 注意：target不可以为滚动容器
    target?: string;
}>(),
    { offset: 0, position: "top", target: "" }
);
```
2. 在`onMounted`内通过`target`选择器去获取父容器
```typescript
onMounted(() => {
    //...
    if (props.target) {
        target.value = document.querySelector < HTMLElement > props.target ?? undefined
        if (!target.value) {
            throw new Error('Target is not existed')
        }
    } else {
        // 如果没有默认设置为document.documentElement
        target.value = document.documentElement
    }
})
```

3. 在`watchEffect(update)`方法中判断是否存在父容器，有则相应添加fixed逻辑,对于没有设置`props.target`逻辑实际上不变，而设置`props.target`主要是基于前者追加对`props.target`的位置信息`targetRect`进行判断，从而设置`fixed状态`和`平滑过渡`
##### 实现拆分
> **position=top情况** <br />fixed状态条件 ：<br/>①. `props.offset > rootTop.value` ：和`没有设置target`相同<br/>②. `targetRect.bottom.value > 0`: target(父容器)必须在可视窗口内，即 targetRect.bottom 如果小于 0 则意味着父容器从可视窗口`顶部`消失，这是就要取消掉 fixed 状态

```javascript
const update = () => {
    // ...
    if (props.position === 'top') {
        if (props.target) {
            // fixed状态条件
            fixed.value = props.offset > rootTop.value && targetRect.bottom.value > 0
        } else {
            // 不存在target的情况
            fixed.value = props.offset >= rootTop.value
        }
    } else {
        fixed.value = windowHeight.value - props.offset < rootBottom.value
    }
}
```
通过以上实现我们预览一下会发现，当父容器逐渐离开时目标元素没有平滑过渡离开，显然我们还要实现如何达到过渡效果

![2022-08-02 09.52.36.gif](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6926384ea1f646e794151f73e1d4ae07~tplv-k3u1fbpfcp-watermark.image?)

> **position=top情况** <br />目标元素过渡 ：`父容器底部位置[动态] - 传入的偏移量[常量] - 目标高度[常量]`

```typescript
// 创建 transform变量用来平滑过度值的保存
const transform = ref(0)

const update = () => {
    // ...
    // 情况一：
    if (props.position === 'top') {
        if (props.target) {
            // fixed判断
            fixed.value = props.offset > rootTop.value && targetRect.bottom.value > 0
            // 目标元素过渡计算：父容器底部位置 - 传入的偏移量 - 目标高度
            // 父容器底部在滚动时位置是实时变化，即当每次滚动时他们的差值就是目标元素过渡值
            const difference = targetRect.bottom.value - props.offset - rootHeight.value
            // 保存平滑过渡值，将其设置到affixStyle transform的translateY值
            transform.value = difference < 0 ? difference : 0
        }
    // ...
    }
}
```
我们将保存的`transform`值设置到`affixStyle`中，这样我们就完成`position=top`且存在 target(父容器)的情况下目标元素固定的逻辑, 以下是实现效果

``` typescript
const affixStyle = computed<CSSProperties>(() => {
    return {
        // ...
        transform: transform.value ? `translateY(${transform.value}px)` : '',
    }
})
```

![2022-08-02 09.55.26.gif](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7a7083e38d2547d5aa8404ed3564ea48~tplv-k3u1fbpfcp-watermark.image?)

对于position=bottom情况下也是基于没有设置`props.target`的条件下，追加一些条件

> **position=bottom**<br/>fixed状态条件 ：<br/>①. `windowHeight.value - props.offset < rootBottom.value`：和没有设置`target`相同<br/>②. `windowHeight.value > targetRect.top.value`: target(父容器)必须在可视窗口内，即 targetRect.top 如果大于可视窗口高度(windowHeight) 则意味着父容器从可视窗口`底部`消失，这时取消掉fixed状态

```javascript
const update = () => {
    // ...
    if (props.position === 'top') {
        // 省略....
    } else if (props.target) {
        // position: bottom 有target
        // 窗口高度 - 传入的偏移量 < 目标元素的底部位置 且 父容器顶部位置小于窗口高度时fixed
        fixed.value = windowHeight.value - props.offset < rootBottom.value &&
        windowHeight.value > targetRect.top.value
    } else {
        // position: bottom 不存在target的情况
        // 窗口高度 - 传入的偏移量 < 目标元素的底部位置
        fixed.value = windowHeight.value - props.offset < rootBottom.value
    }
}
```
> **position=bottom情况** <br />目标元素过渡 ：`可视窗口高度[常量] - 父容器顶部位置top[动态] - 传入的偏移量[常量] - 目标元素的高度[常量]`

```javascript
    const update = () => {
    if (!scrollContainer.value) return
        if (props.position === 'top') {
            // ...
        } else if (props.target) {
            // ...
            const difference = windowHeight.value - targetRect.top.value -
            props.offset - rootHeight.value;
            transform.value = difference < 0 ? -difference : 0
        }
    // ...
    }
```

##### 完成效果

![2022-08-02 09.57.25.gif](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/ee06b81154b845da93fd16c203b43872~tplv-k3u1fbpfcp-watermark.image?)

现在我们就实现完 target 参数的设置啦，具体代码可以查看 [**feat-target分支**](https://github.com/CodeListener/element-plus-affix/tree/feat-target)

## 其余API
目前已经基本完成了`element-plus Affix`组件的核心功能，剩余的API比较简单，我们也一一实现一下：
### 事件
#### change
   当fixed状态改变时触发，同时返回fixed状态
#### scroll
   监听滚动容器并返回`scrollTop`和`fixed`状态
#### 实现
根据事件所描述的我们要实现以下几点：
- 定义`emit`事件: `change`,`scroll`
- 监听`scrollContainer`滚动：实时获取`scrollContainer`的`scrollTop`
- 监听fixed状态: 通过`watch`监听fixed,一旦变更通过`emit('change')`通知外部


``` typescript
// 定义`emit`事件: `change`,`scroll`
const emit = defineEmits<{
  (event: "change", fixed: boolean): void;
  (event: "scroll", value: { scrollTop: number; fixed: boolean }): void;
}>();
// 监听scrollContainer滚动容器
const handleScroll = () => {
  const scrollTop =
    scrollContainer.value instanceof Window
      ? document.documentElement.scrollTop
      : scrollContainer.value?.scrollTop;
  emit("scroll", { fixed: fixed.value, scrollTop: scrollTop || 0 });
};
useEventListener(scrollContainer, "scroll", handleScroll);
// 监听fixed状态并通知
watch(fixed, (v) => emit("change", v));
```

### 外部方法
   #### update
   手动更新固钉状态,这就比较简单了，用到`defineExpose`对外暴露`update`方法即可
   
   `Affix`组件内部
   ```typescript
       defineExpose({ update })
   ```
   外部组件：
   ``` typescript
       // 因为这里使用的是typescript，通过使用`InstanceType<typeof Affix>`
       // 能够获取affixRef所暴露的方法，具体可查看vue官方文档描述
       // https://staging-cn.vuejs.org/guide/typescript/composition-api.html#typing-component-template-refs
       const affixRef = shallowRef<InstanceType<typeof Affix> | null>(null);
       // affixRef.value?.update()
   ```
   ``` html
       <Affix ref="affixRef"><div>11</div></Affix>
   ```
