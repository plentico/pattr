# Pattr

<img src="https://github.com/plentico/pattr/blob/master/pattr.svg" />

A terse, attribute-driven JS library that provides reactive DOM updates within scoped components 

## Purpose

This is a companion project to [Pico](https://github.com/plentico/pico). It's a simple JS script that interacts with "p" attributes on HTML markup to provide reactive updates.

It's a similar concept to [AlpineJS](https://alpinejs.dev/), but the main differences are that AlpineJS does way more, and Pattr has an intentionally compact syntax and scopes components so that:
- Parent changes update Child and Grandchild components
- Child changes update Grandchildren, but do nothing to Parents
- Grandchildren do not impact Child or Parents

Goals: 
1. Modify the markup as little as possible. That means, simple, readable syntax and making inferences from standard html (e.g. an input with type=number automatically converts string value to number). 
2. Minimal influence on dev structure. That means avoiding requirements like wrapping loop items or conditional output in singular root elements.

## Table of Contents

- [Data Sources](#data-sources)
- [Directives](#directives)
- [Event Handling](#event-handling)
- [Scoped Components](#scoped-components)
- [Loops](#loops)
- [Modifiers](#modifiers)

## Data Sources

Pattr reads data from JSON script tags in your HTML:

### Root Data (Props from CMS)
```html
<script id="p-root-data" type="application/json">
{
    "title": "Welcome",
    "count": 5
}
</script>
```

Both data sources are merged and available throughout your app.

## Directives

### `p-text` - Display Text Content

```html
<div p-text="name"></div>
<div p-text="`Hello ${name}!`"></div>
```

### `p-html` - Display HTML Content

```html
<div p-html="htmlContent"></div>
```

**Security Note:** Use with caution. Consider using the `allow` modifier to whitelist safe tags.

### `p-show` - Conditional Display

```html
<span p-show="count > 5">Count is greater than 5</span>
<span p-show="!show_menu">Menu is hidden</span>
```

#### `p-show:pre-scope` - Pre-Scope Conditional Display

For use with wrapped components (e.g., from Pico templating), evaluate visibility **before** `p-scope` runs:

```html
<!-- From Pico: {if age > 10} wraps a component that has p-scope -->
<div p-show:pre-scope="age > 10" p-scope="double = age * 2">
    Your doubled age is: <span p-text="double"></span>
</div>
```

This ensures the conditional from the parent template (`age > 10`) is evaluated using the **parent scope** before the component's `p-scope` executes. Without this, the condition would be evaluated after scoping, which may not be the desired behavior for conditional wrapper components.

You can combine both for complex scenarios:

```html
<!-- Pre-scope: evaluated before p-scope (parent scope context) -->
<!-- Regular p-show: evaluated after p-scope (scoped context) -->
<div 
    p-show:pre-scope="age > 10" 
    p-show="double > 30" 
    p-scope="double = age * 2"
>
    Your doubled age (<span p-text="double"></span>) is greater than 30
</div>
```

### `p-style` - Set Styles

**String syntax:**
```html
<div p-style="show_menu ? 'max-height: 300px' : 'max-height: 0'"></div>
```

**Object syntax:**
```html
<div p-style="{ color: 'red', fontSize: '20px' }"></div>
```

### `p-class` - Set Classes

**String syntax:**
```html
<div p-class="active"></div>
```

**String syntax with template literals**
```html
<div p-class="`base-class ${isActive ? 'active' : ''} ${hasError ? 'error' : ''}`">
```

**Array syntax:**
```html
<div p-class="['btn', 'btn-primary']"></div>
```

**Object syntax (conditional classes):**
```html
<div p-class="{ active: isActive, disabled: !isEnabled }"></div>
```

### `p-attr` - Set Attributes

**Single attributes**
```html
<div 
  p-attr:data-id="userId" 
  p-attr:data-total="price * quantity" 
  p-attr:data-name="firstName + ' ' + lastName"
  p-attr:data-age="`${name} is ${age} years old`"
  p-attr:data-status="isActive ? 'active' : 'inactive'"
  p-attr:data-upper="userName.toUpperCase()"
  p-attr:aria-label="ariaText"
  p-attr:href="linkUrl"
>
```

**Object syntax for multiple attributes**
```html
<div p-attr="{ 
  'data-id': userId, 
  'data-total': price * quantity,
  'data-name': firstName + ' ' + lastName,
  'data-age': `${name} is ${age} years old`,
  'data-status': isActive ? 'active' : 'inactive',
  'data-upper': userName.toUpperCase(),
  'aria-label': ariaText,
  'href': linkUrl 
}">
```

### `p-model` - Two-Way Data Binding

```html
<input type="text" p-model="name" />
<textarea p-model="description"></textarea>
```

## Event Handling

Use `p-on:eventname` to handle events:

```html
<!-- Click events -->
<button p-on:click="count++">Increment</button>
<button p-on:click="count--">Decrement</button>
<button p-on:click="items = [...items, 'New Item']">Add Item</button>

<!-- Input events -->
<input p-on:focus="isEditing = true" p-on:blur="isEditing = false" />

<!-- Multiple statements -->
<button p-on:click="count++; show_menu = false">Update & Close</button>
```

Available events: `click`, `focus`, `blur`, `input`, `change`, `submit`, `keydown`, `keyup`, `mouseenter`, `mouseleave`, etc.

## Scoped Components

Create nested components with isolated reactive state using `p-scope` (and optionally `p-id`):

```html
<div>
    Parent count: <span p-text="count"></span>
    <button p-on:click="count++">+</button>
</div>

<section p-id="child1" p-scope="count = count * 2; name = name + 'o';">
    <div>Child count (×2): <span p-text="count"></span></div>
    <button p-on:click="count++">+</button>
    
    <section p-scope="count = count + 1;">
        <div>Grandchild count (+1): <span p-text="count"></span></div>
        <button p-on:click="count++">+</button>
    </section>
</section>
```

> The `p-id` attribute used to be required to use p-scope, now it's optional and can be omitted entirely. It's still available because it could be helpful for debugging purposes, migrating data between elements, or if external tools/scripts need to reference scopes by name.

### Scoping Example

Components down the chain can diverge from the reactivity provided by their Parent components. However, if a Parent component is updated, it will resync all descendant components.

```
Parent = 2
Child (Parent * 2) = 4
Grandchild (Child + 1) = 5
```

If we increment Parent by 1:

```
Parent = 3
Child (Parent * 2) = 6
Grandchild (Child + 1) = 7
```

If we now increment Child by 1 (diverges from Parent):

```
Parent = 3
Child (Parent * 2) = 7
Grandchild (Child + 1) = 8
```

But if we then increment Parent by 1 (resyncs with Parent):

```
Parent = 4
Child (Parent * 2) = 8
Grandchild (Child + 1) = 9
```

## Loops

Use `p-for` with `<template>` to iterate over data:

### Simple Iteration

```html
<template p-for="item of items">
    <div p-text="item"></div>
</template>
```

### With Index (Array Destructuring)

```html
<template p-for="[i, item] of items.entries()">
    <div>
        <span p-text="i"></span>: <span p-text="item"></span>
    </div>
</template>
```

### Nested Loops (BROKEN, STILL WIP)

```html
<template p-for="[i, cat] of cats.entries()">
    <div>
        <h3 p-text="cat"></h3>
        <template p-for="letter of cat">
            <button p-on:click="cats[i] = cat + letter" p-text="letter"></button>
        </template>
    </div>
</template>
```

### Loop Actions

```html
<template p-for="[i, item] of items.entries()">
    <div>
        <span p-text="item"></span>
        
        <!-- Remove item -->
        <button p-on:click="items = items.filter((_, idx) => idx !== i)">Remove</button>
        
        <!-- Update item -->
        <button p-on:click="items[i] = items[i] + '!'">Add !</button>
    </div>
</template>

<!-- Add new item -->
<input p-model="new_item" />
<button p-on:click="items = [...items, new_item]; new_item = ''">Add</button>
```

### SSR Support

Pattr supports hydrating server-side rendered loops. Add `p-for-key` attributes to SSR elements:

```html
<template p-for="item of items">
    <div>...</div>
</template>

<!-- SSR rendered elements -->
<div p-for-key="0">Apple</div>
<div p-for-key="1">Banana</div>
<div p-for-key="2">Orange</div>
```

## Modifiers

Modifiers extend directive functionality using colon syntax:

### Trim Text

Limit text length and add ellipsis:

```html
<div p-text:trim.50="longText"></div>
<!-- Result: "This is a very long text that will be tr..." -->
```

### Trim HTML

Trim HTML while preserving tags:

```html
<div p-html:trim.100="htmlContent"></div>
```

### Allow HTML Tags

Whitelist specific HTML tags (removes all others):

```html
<div p-html:allow.strong.em.p="unsafeHtml"></div>
```

### Combine Modifiers

Chain multiple modifiers together:

```html
<div p-html:allow.strong.em:trim.50="htmlContent"></div>
```

## Installation

### CDN

```html
<!-- Via unpkg -->
<script src="https://unpkg.com/@plentico/pattr" defer></script>

<!-- Via jsdelivr -->
<script src="https://cdn.jsdelivr.net/npm/@plentico/pattr" defer></script>

<!-- Minified -->
<script src="https://unpkg.com/@plentico/pattr/min" defer></script>
```

### npm

```bash
npm install @plentico/pattr
```

```javascript
import Pattr from '@plentico/pattr';
```

### Local

```html
<script src="/pattr.js" defer></script>
```

## Complete Example

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://unpkg.com/@plentico/pattr" defer></script>
    <script id="p-root-data" type="application/json">
    {
        "title": "Todo App",
        "username": "John"
    }
    </script>
    <script id="p-local-data" type="application/json">
    {
        "todos": ["Buy groceries", "Walk dog"],
        "new_todo": "",
        "show_completed": false
    }
    </script>
</head>
<body>
    <h1 p-text="title"></h1>
    <p>Welcome, <span p-text="username"></span>!</p>
    
    <!-- Add todo -->
    <input p-model="new_todo" placeholder="New todo..." />
    <button p-on:click="todos = [...todos, new_todo]; new_todo = ''">
        Add Todo
    </button>
    
    <!-- Todo list -->
    <template p-for="[i, todo] of todos.entries()">
        <div>
            <span p-text="todo"></span>
            <button p-on:click="todos = todos.filter((_, idx) => idx !== i)">
                Delete
            </button>
        </div>
    </template>
    
    <!-- Scoped component -->
    <section p-scope="count = todos.length;">
        <p>Total todos: <span p-text="count"></span></p>
    </section>
</body>
</html>
```

## Browser Support

Pattr uses modern JavaScript features:
- Proxy
- Template literals
- Arrow functions
- Destructuring
- Spread operator

Supports all modern browsers (Chrome, Firefox, Safari, Edge).

## License

MIT
