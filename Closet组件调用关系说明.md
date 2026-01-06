# Closet 组件调用关系说明

## 概述

`Closet` 组件是换装游戏中的核心组件，负责展示和管理衣柜中的物品。它支持按职业分类浏览、按性别过滤，并提供拖拽功能将物品添加到画布上。

## 组件位置

```
src/components/Closet.tsx
```

## 核心功能

### 1. 职业分类浏览
- 初始状态显示所有可用职业的图标网格
- 用户点击职业后，显示该职业下的所有物品
- 支持返回按钮回到职业选择界面

### 2. 物品过滤逻辑
- **性别过滤**：根据 `avatarGender` 过滤物品
  - 显示条件：`!item.gender || item.gender === "unisex" || item.gender === avatarGender`
- **职业过滤**：根据选中的职业过滤物品
  - 如果选择 "all"，显示所有职业的物品
  - 否则只显示匹配 `item.occupation === selectedOcc` 的物品

### 3. 拖拽功能
- 每个物品支持 HTML5 拖拽
- 拖拽开始时调用 `onStartDrag(id)`
- 拖拽结束时调用 `onEndDrag()`
- 使用空图片作为拖拽图像，由父组件显示自定义拖拽预览

## 调用关系图

```
App.tsx
  └── AvatarStudio.tsx
       ├── BodyTab.tsx
       │    └── Closet (items: body 类型物品)
       ├── OutfitTab.tsx
       │    └── Closet (items: outfit 类型物品)
       └── AccessoriesTab.tsx
            └── Closet (items: accessories 类型物品)
```

## 详细调用链

### 1. 数据源

**文件**: `src/closetData.ts`

```typescript
export const CLOSET: ClosetItem[] = [
  {
    id: "boyHair1",
    name: "Boy Hair Style 1",
    occupation: "fashion",
    type: "hair",
    gender: "male",
    tab: "body",  // 决定在哪个 Tab 中显示
    // ...
  },
  // ...
]
```

### 2. AvatarStudio 组件

**文件**: `src/components/AvatarStudio.tsx`

**职责**:
- 管理全局状态（性别、当前 tab、已放置物品等）
- 根据当前 tab 过滤物品：`const filteredCloset = CLOSET.filter((item) => item.tab === tab)`
- 将过滤后的物品列表传递给各个 Tab 组件

**关键代码**:
```146:164:src/components/AvatarStudio.tsx
  const filteredCloset = CLOSET.filter((item) => item.tab === tab);

  const previewItem = draggingClosetId
    ? CLOSET.find((c) => c.id === draggingClosetId) ?? null
    : null;

  const sharedTabProps = {
    gender,
    setGender,
    tab,
    placed,
    setPlaced,
    setDraggingClosetId,
    setDragPos,
    draggingClosetId,
    dragPos,
    topZ,
    setTopZ,
    closet: filteredCloset,
    canvasWidth: CANVAS_WIDTH,
    canvasHeight: CANVAS_HEIGHT,
    placeClosetItem,
    snapItems,
    showTrash,
    removePlacedByClosetId,
```

### 3. Tab 组件调用 Closet

#### 3.1 BodyTab

**文件**: `src/components/BodyTab.tsx`

**调用位置**: 第 122-137 行

**传递的参数**:
- `items`: 经过性别和职业过滤的 body 类型物品
- `avatarGender`: 当前选择的性别
- `tab`: "body"
- `onStartDrag`: 设置拖拽状态
- `onEndDrag`: 清除拖拽状态
- `occupationOptions`: 从物品中提取的职业选项列表
- `children`: 性别选择器组件

**过滤逻辑**:
```63:73:src/components/BodyTab.tsx
  const filteredCloset =
    occupationFilter === "all"
      ? closetItems.filter(
          (item) =>
            !item.gender || item.gender === gender || item.gender === "unisex"
        )
      : closetItems.filter(
          (item) =>
            (item.occupation ?? "other") === occupationFilter &&
            (!item.gender || item.gender === gender || item.gender === "unisex")
        );
```

#### 3.2 OutfitTab

**文件**: `src/components/OutfitTab.tsx`

**调用位置**: 第 110-123 行

**传递的参数**:
- `items`: 经过性别和职业过滤的 outfit 类型物品
- `avatarGender`: 当前选择的性别
- `tab`: "outfit"
- `onStartDrag`: 设置拖拽状态
- `onEndDrag`: 清除拖拽状态
- `occupationOptions`: 从物品中提取的职业选项列表

**过滤逻辑**:
```64:74:src/components/OutfitTab.tsx
  const filteredCloset =
    occupationFilter === "all"
      ? closetItems.filter(
          (item) =>
            !item.gender || item.gender === gender || item.gender === "unisex"
        )
      : closetItems.filter(
          (item) =>
            (item.occupation ?? "other") === occupationFilter &&
            (!item.gender || item.gender === gender || item.gender === "unisex")
        );
```

#### 3.3 AccessoriesTab

**文件**: `src/components/AccessoriesTab.tsx`

**调用位置**: 第 93-111 行

**传递的参数**:
- `items`: accessories 类型物品（仅按 tab 过滤，不按性别）
- `avatarGender`: 当前选择的性别
- `tab`: "accessories"
- `onStartDrag`: 设置拖拽状态
- `onEndDrag`: 清除拖拽状态
- `occupationOptions`: 从物品中提取的职业选项列表

**过滤逻辑**:
```57:57:src/components/AccessoriesTab.tsx
  const filteredCloset = closet.filter((item) => item.tab === "accessories");
```

## Closet 组件内部逻辑

### 状态管理

```34:34:src/components/Closet.tsx
  const [selectedOcc, setSelectedOcc] = useState<string | null>(null);
```

- `selectedOcc`: 当前选中的职业，`null` 表示显示职业选择界面

### 渲染逻辑分支

#### 分支 1: 职业选择界面（`selectedOcc === null`）

```39:74:src/components/Closet.tsx
  if (!selectedOcc) {
    return (
      <div className="closet card">
        <h1>Closet</h1>
        {children && <div style={{ marginBottom: "1em" }}>{children}</div>}
        <div className="closetGrid">
          {occupationOptions.map((occ) => (
            <div
              className="closetItem"
              key={occ}
              style={{ cursor: "pointer", borderStyle: "solid" }}
              onClick={() => setSelectedOcc(occ)}
              tabIndex={0}
              role="button"
            >
              <div className="closetPreview">
                <img
                  src={OCC_IMAGES[occ] ?? OCC_IMAGES.all}
                  alt={occ}
                  style={{
                    width: "80%",
                    height: "80%",
                    objectFit: "contain",
                    pointerEvents: "none",
                    opacity: 0.83,
                  }}
                />
              </div>
              <div className="closetLabel" style={{ fontSize: 16 }}>
                {pretty(occ)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
```

**功能**:
- 显示所有职业选项的网格
- 每个职业显示对应的图标（来自 `OCC_IMAGES`）
- 点击职业后设置 `selectedOcc`，切换到物品列表

#### 分支 2: 物品列表界面（`selectedOcc !== null`）

```77:125:src/components/Closet.tsx
  const filteredItems = items.filter(
    (it) =>
      (!it.gender || it.gender === "unisex" || it.gender === avatarGender) &&
      (selectedOcc === "all" || it.occupation === selectedOcc)
  );

  return (
    <div className="closet card">
      <button onClick={() => setSelectedOcc(null)}>← Back</button>
      <div className="closetGrid">
        {filteredItems.length ? (
          filteredItems.map((it) => (
            <div
              key={it.id}
              className="closetItem"
              draggable
              onDragStart={(e) => {
                onStartDrag(it.id);
                // Set the drag image to empty so we can use our custom DragGhost
                e.dataTransfer.setDragImage(emptyImg, 0, 0);
                e.dataTransfer.setData("application/x-avatar-item-id", it.id);
                e.dataTransfer.setData("text/plain", it.id);
                e.dataTransfer.effectAllowed = "copy";
              }}
              onDragEnd={onEndDrag}
            >
              <div className="closetPreview">
                <img
                  src={it.src}
                  alt={it.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    pointerEvents: "none",
                  }}
                />
              </div>
              <div className="closetLabel">{it.name}</div>
            </div>
          ))
        ) : (
          <div style={{ padding: 20, color: "#aaa" }}>
            No items for this occupation.
          </div>
        )}
      </div>
    </div>
  );
```

**功能**:
- 显示返回按钮
- 根据选中职业和性别再次过滤物品
- 渲染可拖拽的物品列表
- 每个物品支持拖拽，拖拽时设置自定义数据

### 过滤逻辑详解

```77:81:src/components/Closet.tsx
  const filteredItems = items.filter(
    (it) =>
      (!it.gender || it.gender === "unisex" || it.gender === avatarGender) &&
      (selectedOcc === "all" || it.occupation === selectedOcc)
  );
```

**过滤条件**:
1. **性别匹配**:
   - 物品没有 `gender` 属性，或
   - 物品 `gender` 为 "unisex"，或
   - 物品 `gender` 等于当前 `avatarGender`

2. **职业匹配**:
   - 如果 `selectedOcc === "all"`，显示所有职业
   - 否则只显示 `item.occupation === selectedOcc` 的物品

## 数据流图

```
closetData.ts (CLOSET 数组)
    │
    ├─→ AvatarStudio.tsx
    │      │
    │      └─→ 按 tab 过滤: CLOSET.filter(item => item.tab === currentTab)
    │             │
    │             ├─→ BodyTab.tsx
    │             │     │
    │             │     └─→ 按性别和职业过滤
    │             │           │
    │             │           └─→ Closet (items: filteredCloset)
    │             │
    │             ├─→ OutfitTab.tsx
    │             │     │
    │             │     └─→ 按性别和职业过滤
    │             │           │
    │             │           └─→ Closet (items: filteredCloset)
    │             │
    │             └─→ AccessoriesTab.tsx
    │                   │
    │                   └─→ 仅按 tab 过滤
    │                         │
    │                         └─→ Closet (items: filteredCloset)
    │
    └─→ Closet 组件内部
          │
          ├─→ 职业选择界面 (selectedOcc === null)
          │     └─→ 显示所有 occupationOptions
          │
          └─→ 物品列表界面 (selectedOcc !== null)
                └─→ 再次过滤: 按 selectedOcc 和 avatarGender
                      └─→ 显示 filteredItems
```

## 关键 Props 说明

| Prop | 类型 | 说明 |
|------|------|------|
| `items` | `ClosetItem[]` | 已经过 Tab 级别过滤的物品列表 |
| `avatarGender` | `Gender` | 当前选择的角色性别，用于过滤物品 |
| `tab` | `TabKey` | 当前 tab 类型（"body" | "outfit" | "accessories"），虽然未在组件内使用，但保持接口一致性 |
| `onStartDrag` | `(id: string) => void` | 拖拽开始时的回调，通知父组件当前拖拽的物品 ID |
| `onEndDrag` | `() => void` | 拖拽结束时的回调，通知父组件拖拽已结束 |
| `occupationOptions` | `string[]` | 可选的职业列表，用于显示职业选择界面 |
| `children` | `ReactNode?` | 可选的自定义内容，如 BodyTab 中的性别选择器 |

## 拖拽机制

### 拖拽流程

1. **用户开始拖拽物品**
   - 触发 `onDragStart` 事件
   - 调用 `onStartDrag(it.id)` 通知父组件
   - 设置空的拖拽图像：`e.dataTransfer.setDragImage(emptyImg, 0, 0)`
   - 存储物品 ID 到拖拽数据中

2. **拖拽过程中**
   - 父组件（AvatarStudio）监听全局 `dragover` 事件
   - 更新 `dragPos` 状态，用于显示自定义拖拽预览（DragGhost）

3. **用户释放物品**
   - 触发 `onDragEnd` 事件
   - 调用 `onEndDrag()` 通知父组件
   - 如果拖放到画布上，由 `AvatarCanvas` 处理 `drop` 事件

### 拖拽数据格式

```93:99:src/components/Closet.tsx
              onDragStart={(e) => {
                onStartDrag(it.id);
                // Set the drag image to empty so we can use our custom DragGhost
                e.dataTransfer.setDragImage(emptyImg, 0, 0);
                e.dataTransfer.setData("application/x-avatar-item-id", it.id);
                e.dataTransfer.setData("text/plain", it.id);
                e.dataTransfer.effectAllowed = "copy";
              }}
```

- `application/x-avatar-item-id`: 自定义 MIME 类型，存储物品 ID
- `text/plain`: 标准文本格式，也存储物品 ID（兼容性）

## 职业图标映射

```8:15:src/components/Closet.tsx
const OCC_IMAGES: Record<string, string> = {
  all: "https://api.iconify.design/ic:round-category.svg?color=%23cfe1ef",
  doctor: "https://api.iconify.design/healthicons:doctor.svg",
  chef: "https://api.iconify.design/fluent-emoji-flat:chef.svg",
  police: "https://api.iconify.design/fluent-emoji-flat:police-officer.svg",
  artist: "https://api.iconify.design/fluent-emoji-flat:artist.svg",
  fashion: "https://api.iconify.design/fluent-emoji-flat:t-shirt.svg",
};
```

使用 Iconify API 获取职业图标，如果职业不在映射中，则使用 "all" 的图标。

## 总结

`Closet` 组件是一个两级导航的衣柜界面：
1. **第一级**：职业选择界面，用户选择要浏览的职业
2. **第二级**：物品列表界面，显示选中职业下的所有物品

组件接收已经过 Tab 级别过滤的物品列表，然后根据用户选择的职业和当前性别进行二次过滤，最终展示可拖拽的物品。

整个调用链遵循"数据向下流动，事件向上冒泡"的 React 设计模式，通过 props 传递数据和回调函数实现组件间的通信。

