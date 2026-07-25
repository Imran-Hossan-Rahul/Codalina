# React 18 + Vite 5 + SWC: 'Cannot read properties of null' in Strict Mode — The Real Fix

## Table of Contents

1. The Problem — What You're Seeing
2. Why This Happens (The Root Cause)
3. The Quick Fix (If You're in a Hurry)
4. The Proper Fix (Recommended)
5. Understanding React 18 Strict Mode Changes
6. How SWC Compiles Differently from Babel
7. Step-by-Step Debugging Process
8. Common Variations of This Error
9. Prevention: How to Avoid This in Future
10. FAQ

## 1. The Problem — What You're Seeing

You're working on a React project with Vite 5. Everything was fine yesterday. Today you run `npm run dev` and suddenly your console explodes with:

```
TypeError: Cannot read properties of null (reading 'xxx')
    at ComponentName (ComponentName.jsx:15:8)
    at renderWithHooks (react-dom.development.js:16305:18)
    at mountIndeterminateComponent (react-dom.development.js:20074:13)
```

Or maybe:

```
TypeError: Cannot read properties of null (reading 'style')
TypeError: Cannot read properties of null (reading 'addEventListener')
TypeError: Cannot read properties of null (reading 'focus')
```

The error points to a line where you're doing something like:

```jsx
const myRef = useRef(null);

useEffect(() => {
  myRef.current.style.color = 'red';  //  BOOM!
}, []);
```

**Here's the confusing part:** The same code worked perfectly in Create React App. It worked in Vite 4. It even worked before you updated to React 18.3. So what changed?

**Short answer:** React 18's Strict Mode + Vite 5's SWC compiler + how refs behave during double-mounting = this exact error.

Let's break it down properly.

## 2. Why This Happens (The Root Cause)

### 2.1 React 18 Introduced Double Mounting in Strict Mode

React 18 changed how Strict Mode works in **development mode only**.

In React 17 and earlier, Strict Mode would:
- Show warnings about deprecated APIs
- Detect side effects

In React 18, Strict Mode **mounts your component twice** in development:

```
Mount → Unmount → Remount
```

This is intentional. React wants to help you catch side effects that don't clean up properly. But it breaks code that assumes refs are immediately available.

Here's what happens step by step:

**First Mount:**
1. Component renders → ref is null
2. useEffect runs → ref.current now has the DOM node
3. You do something with ref.current → works fine

**Then React 18 unmounts it:**
4. Cleanup function runs (if any)
5. Component unmounts → ref.current becomes null again

**Then React 18 remounts it:**
6. Component renders → ref is null again
7. useEffect runs → ref.current now has the DOM node

**The problem:** If your `useEffect` doesn't have a proper cleanup, or if you're accessing `ref.current` outside of `useEffect`, you hit the error during the unmount/remount cycle.

### 2.2 Why Vite 5 + SWC Makes This More Visible

Vite 5 uses SWC (Speedy Web Compiler) by default instead of Babel. SWC compiles React code differently:

| Aspect | Babel (Vite 4 / CRA) | SWC (Vite 5) |
|--------|---------------------|--------------|
| Compilation speed | Slower | Faster |
| JSX transform | Classic or automatic | Automatic only |
| Strict Mode enforcement | Same | Same |
| Dev server HMR | Different internals | Different internals |
| Error stack traces | Sometimes clearer | Sometimes different |

**Key difference:** SWC compiles `useEffect` cleanup functions slightly differently. In some edge cases, the cleanup doesn't fire exactly when Babel would fire it. This means:

- In Babel: Your ref might still "accidentally work" because cleanup timing is forgiving
- In SWC: The timing is stricter, so the null ref error surfaces immediately

**This is NOT a bug in SWC.** It's actually doing the right thing — exposing a bug in your code that Babel was hiding.

### 2.3 The Specific Scenario

Here's the exact code pattern that breaks:

```jsx
import { useRef, useEffect } from 'react';

function MyComponent() {
  const buttonRef = useRef(null);

  useEffect(() => {
    //  DANGEROUS: No null check!
    buttonRef.current.style.backgroundColor = 'blue';

    //  DANGEROUS: No cleanup!
    buttonRef.current.addEventListener('click', handleClick);
  }, []);

  return <button ref={buttonRef}>Click me</button>;
}
```

When React 18 Strict Mode double-mounts:
1. First mount: `buttonRef.current` = `<button>` → works
2. Unmount: `buttonRef.current` = `null`
3. Remount: `useEffect` runs again, but if cleanup didn't run properly, you get the error

## 3. The Quick Fix (If You're in a Hurry)

If you need to ship code RIGHT NOW and can't refactor everything, here are three quick fixes. **Use these temporarily, then come back and do the proper fix.**

### Quick Fix 1: Disable Strict Mode (NOT Recommended Long-term)

In your `main.jsx` or `main.tsx`:

```jsx
//  TEMPORARY ONLY — Don't keep this
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>  ← Comment this out
    <App />
  // </React.StrictMode>
);
```

**Why this is bad:** You're turning off a safety feature. React added double-mounting to catch real bugs. Disabling it means those bugs will hit production instead.

### Quick Fix 2: Add Null Checks Everywhere

Wrap every `ref.current` access:

```jsx
useEffect(() => {
  if (!buttonRef.current) return;  //  Quick null check

  buttonRef.current.style.backgroundColor = 'blue';
}, []);
```

**Why this is incomplete:** It stops the crash, but doesn't fix the underlying cleanup issue. Event listeners might still leak.

### Quick Fix 3: Use Optional Chaining

```jsx
useEffect(() => {
  buttonRef.current?.style?.backgroundColor = 'blue';  //  No crash
}, []);
```

**Why this is incomplete:** Same as above — no crash, but potential memory leaks from uncleared event listeners.

## 4. The Proper Fix (Recommended)

The proper fix has **three parts**. You need all three for production-quality code.

### Part 1: Always Check for Null Before Using Refs

```jsx
import { useRef, useEffect } from 'react';

function MyComponent() {
  const buttonRef = useRef(null);

  useEffect(() => {
    const button = buttonRef.current;

    //  STEP 1: Null check
    if (!button) return;

    // Now safe to use
    button.style.backgroundColor = 'blue';

  }, []);

  return <button ref={buttonRef}>Click me</button>;
}
```

**Why this works:** During the unmount phase, `buttonRef.current` is `null`. The early return prevents the crash.

### Part 2: Always Provide Cleanup Functions

```jsx
import { useRef, useEffect } from 'react';

function MyComponent() {
  const buttonRef = useRef(null);

  useEffect(() => {
    const button = buttonRef.current;

    if (!button) return;

    // Setup
    button.style.backgroundColor = 'blue';

    const handleClick = () => console.log('Clicked!');
    button.addEventListener('click', handleClick);

    //  STEP 2: Cleanup function
    return () => {
      button.removeEventListener('click', handleClick);
      button.style.backgroundColor = '';  // Reset if needed
    };

  }, []);

  return <button ref={buttonRef}>Click me</button>;
}
```

**Why cleanup matters:** When React 18 unmounts your component for the double-mount, the cleanup runs. When it remounts, everything starts fresh. No leaked event listeners, no stale state.

### Part 3: Use Callback Refs for Complex DOM Logic

If you're doing complex DOM manipulation, use a **callback ref** instead of `useRef`:

```jsx
import { useCallback } from 'react';

function MyComponent() {
  const buttonRef = useCallback((node) => {
    //  STEP 3: Callback ref gives you the node directly
    if (node !== null) {
      node.style.backgroundColor = 'blue';

      const handleClick = () => console.log('Clicked!');
      node.addEventListener('click', handleClick);

      // Return cleanup for when node is removed
      return () => {
        node.removeEventListener('click', handleClick);
        node.style.backgroundColor = '';
      };
    }
  }, []);

  return <button ref={buttonRef}>Click me</button>;
}
```

**Why callback refs are better here:** React calls this function with the DOM node when it mounts, and with `null` when it unmounts. You get explicit control over the lifecycle.

### Complete Production-Ready Example

Here's the full pattern you should use:

```jsx
import { useRef, useEffect } from 'react';

function SafeDOMComponent() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;

    //  Null check
    if (!container) return;

    //  Setup
    const setup = () => {
      container.style.opacity = '0';
      container.style.transition = 'opacity 0.3s ease';

      // Force reflow
      container.offsetHeight; 

      container.style.opacity = '1';
    };

    setup();

    //  Cleanup
    return () => {
      container.style.opacity = '';
      container.style.transition = '';
    };

  }, []);

  return (
    <div ref={containerRef} className="fade-in-container">
      Content here
    </div>
  );
}
```

### TypeScript Version

```tsx
import { useRef, useEffect } from 'react';

function SafeDOMComponentTS() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    container.style.opacity = '0';
    container.style.transition = 'opacity 0.3s ease';
    container.offsetHeight;
    container.style.opacity = '1';

    return () => {
      container.style.opacity = '';
      container.style.transition = '';
    };

  }, []);

  return (
    <div ref={containerRef} className="fade-in-container">
      Content here
    </div>
  );
}
```

## 5. Understanding React 18 Strict Mode Changes

### What Changed in React 18 Strict Mode?

React 18.0 (released March 2022) introduced a new Strict Mode behavior. Here's the official timeline:

| React Version | Strict Mode Behavior |
|--------------|---------------------|
| React 16.x | Warnings only |
| React 17.x | Warnings + effect detection |
| React 18.0+ | **Double mounting in development** |
| React 18.3+ | Same, but more aggressive |

### Why Did React Add Double Mounting?

React team wanted to prepare developers for **Concurrent Features** (like Suspense, transitions, etc.). In concurrent rendering, React might:

- Start rendering a component
- Pause and do something else
- Come back and finish (or restart)

If your effects don't clean up properly, this causes:
- Memory leaks
- Stale event listeners
- Duplicate subscriptions
- Weird UI bugs

Double mounting in development simulates this behavior so you catch bugs early.

### How to Verify Strict Mode Is the Cause

Add this to your component temporarily:

```jsx
import { useRef, useEffect } from 'react';

function DebugComponent() {
  const renderCount = useRef(0);
  const buttonRef = useRef(null);

  useEffect(() => {
    renderCount.current += 1;
    console.log(`Mount #${renderCount.current}`);
    console.log('ref.current =', buttonRef.current);

    return () => {
      console.log(`Cleanup #${renderCount.current}`);
      console.log('ref.current during cleanup =', buttonRef.current);
    };
  });

  return <button ref={buttonRef}>Test</button>;
}
```

**With Strict Mode ON, you'll see:**

```
Mount #1
ref.current = <button>Test</button>
Cleanup #1
ref.current during cleanup = null
Mount #2
ref.current = <button>Test</button>
Cleanup #2
ref.current during cleanup = null
```

**With Strict Mode OFF, you'll see:**

```
Mount #1
ref.current = <button>Test</button>
```

This proves Strict Mode is causing the double lifecycle.

## 6. How SWC Compiles Differently from Babel

### What Is SWC?

SWC (Speedy Web Compiler) is a Rust-based JavaScript/TypeScript compiler. Vite 5 switched from esbuild + Babel to SWC for React Fast Refresh.

### Key Compilation Differences

**Babel JSX Transform (Classic):**

```jsx
// Input
function App() {
  return <div ref={myRef}>Hello</div>;
}

// Babel output
function App() {
  return React.createElement('div', { ref: myRef }, 'Hello');
}
```

**SWC JSX Transform (Automatic):**

```jsx
// Input
function App() {
  return <div ref={myRef}>Hello</div>;
}

// SWC output
import { jsx as _jsx } from "react/jsx-runtime";
function App() {
  return _jsx("div", { ref: myRef, children: "Hello" });
}
```

### Why This Matters for Ref Errors

SWC's automatic runtime has slightly different timing for:
1. When refs are assigned
2. When effects are scheduled
3. When cleanup runs

In most cases, this is identical. But in edge cases with conditional rendering, dynamic refs, or multiple refs on same element, SWC might expose timing issues that Babel masked.

### How to Check Your Compiler

Run this in your terminal:

```bash
# Check Vite version
npm list vite

# Check if using @vitejs/plugin-react-swc
cat vite.config.js | grep -i "swc"

# Or check package.json
cat package.json | grep -E "vite|swc|babel"
```

**Expected output for Vite 5 + SWC:**

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react-swc": "^3.5.0"
  }
}
```

### Can You Switch Back to Babel?

Yes, but you lose the speed benefits:

```js
// vite.config.js — Using Babel instead of SWC
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'; // NOT @vitejs/plugin-react-swc

export default defineConfig({
  plugins: [react()],
});
```

**My recommendation:** Don't switch. SWC is the future. Fix your code instead.

## 7. Step-by-Step Debugging Process

When you hit this error, follow this exact debugging flow:

### Step 1: Read the Full Error Stack

Don't just read the first line. Scroll down:

```
TypeError: Cannot read properties of null (reading 'style')
    at MyComponent (MyComponent.jsx:15:8)          ← Your code
    at renderWithHooks (react-dom.development.js)   ← React internals
    at mountIndeterminateComponent (react-dom...)   ← React internals
    at beginWork (react-dom.development.js)         ← React internals
```

**Line 15 in MyComponent.jsx** is where the crash happens. Go there.

### Step 2: Identify the Ref Pattern

Look at the code around line 15:

```jsx
//  BAD PATTERN — Look for these
useEffect(() => {
  myRef.current.style.color = 'red';        // Line 15 ← CRASH HERE
}, []);
```

Ask yourself:
- Is `myRef.current` being accessed without a null check?
- Is there a cleanup function?
- Is the ref being used outside `useEffect`?

### Step 3: Add Console Logs

Add temporary logs to understand the lifecycle:

```jsx
function MyComponent() {
  const myRef = useRef(null);

  console.log('Render: myRef.current =', myRef.current);

  useEffect(() => {
    console.log('Effect run: myRef.current =', myRef.current);

    return () => {
      console.log('Cleanup: myRef.current =', myRef.current);
    };
  });

  return <div ref={myRef}>Content</div>;
}
```

### Step 4: Check Strict Mode Status

Look at your entry file (`main.jsx` or `index.jsx`):

```jsx
// Check if this wrapper exists
<React.StrictMode>
  <App />
</React.StrictMode>
```

If yes, that's (part of) your problem.

### Step 5: Apply the Proper Fix

Use the pattern from Section 4:
1. Null check
2. Cleanup function
3. (Optional) Callback ref for complex cases

### Step 6: Verify the Fix

After fixing, your console should show:

```
Render: myRef.current = null
Effect run: myRef.current = <div>Content</div>
Cleanup: myRef.current = null
Render: myRef.current = null
Effect run: myRef.current = <div>Content</div>
```

No errors. The ref goes null during unmount, but your code handles it.

## 8. Common Variations of This Error

### Variation 1: Third-Party Library Refs

```jsx
import { useEffect, useRef } from 'react';
import SomeChartLibrary from 'some-chart-lib';

function ChartComponent() {
  const chartRef = useRef(null);

  useEffect(() => {
    //  CRASH: chartRef.current might be null
    const chart = new SomeChartLibrary(chartRef.current);
    chart.render();
  }, []);

  return <div ref={chartRef} />;
}
```

**Fix:**

```jsx
useEffect(() => {
  if (!chartRef.current) return;  //  Null check

  const chart = new SomeChartLibrary(chartRef.current);
  chart.render();

  return () => {
    chart.destroy();  //  Cleanup
  };
}, []);
```

### Variation 2: Refs in Conditional Rendering

```jsx
function ConditionalComponent({ showButton }) {
  const buttonRef = useRef(null);

  useEffect(() => {
    //  CRASH: If showButton is false, ref is null
    buttonRef.current.focus();
  }, []);

  return showButton ? <button ref={buttonRef}>Click</button> : null;
}
```

**Fix:**

```jsx
useEffect(() => {
  if (!buttonRef.current) return;  //  Handles conditional case
  buttonRef.current.focus();
}, [showButton]);  //  Add dependency
```

### Variation 3: Refs with setTimeout/setInterval

```jsx
function TimerComponent() {
  const boxRef = useRef(null);

  useEffect(() => {
    setTimeout(() => {
      //  CRASH: Component might have unmounted by now
      boxRef.current.style.display = 'none';
    }, 5000);
  }, []);

  return <div ref={boxRef}>Disappears in 5s</div>;
}
```

**Fix:**

```jsx
useEffect(() => {
  const timer = setTimeout(() => {
    if (boxRef.current) {  //  Check before using
      boxRef.current.style.display = 'none';
    }
  }, 5000);

  return () => clearTimeout(timer);  //  Cleanup timer
}, []);
```

### Variation 4: Refs in Event Handlers

```jsx
function FormComponent() {
  const inputRef = useRef(null);

  const handleSubmit = () => {
    //  CRASH: If component unmounted during async operation
    inputRef.current.value = '';
  };

  return <input ref={inputRef} onSubmit={handleSubmit} />;
}
```

**Fix:**

```jsx
const handleSubmit = () => {
  if (inputRef.current) {  //  Always check
    inputRef.current.value = '';
  }
};
```

### Variation 5: Multiple Refs on Same Element

```jsx
function MultiRefComponent() {
  const ref1 = useRef(null);
  const ref2 = useRef(null);

  useEffect(() => {
    //  CRASH: Which ref has the element?
    ref1.current.style.color = 'red';
    ref2.current.style.color = 'blue';
  }, []);

  return <div ref={ref1}>Content</div>;  // ref2 never gets assigned!
}
```

**Fix:** Use callback refs or merge refs:

```jsx
import { useCallback, useRef } from 'react';

function MultiRefComponent() {
  const ref1 = useRef(null);
  const ref2 = useRef(null);

  const setRefs = useCallback((node) => {
    ref1.current = node;
    ref2.current = node;
  }, []);

  useEffect(() => {
    if (!ref1.current) return;
    // Now safe to use
  }, []);

  return <div ref={setRefs}>Content</div>;
}
```

## 9. Prevention: How to Avoid This in Future

### ESLint Rule Setup

Add this to your `.eslintrc`:

```json
{
  "extends": [
    "eslint:recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

This won't catch null ref errors directly, but it helps with effect dependencies.

### Custom Hook for Safe Refs

Create a reusable hook:

```jsx
// hooks/useSafeRef.js
import { useRef, useEffect } from 'react';

export function useSafeRef(callback) {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const cleanup = callback(element);

    return () => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, []);

  return ref;
}
```

**Usage:**

```jsx
function MyComponent() {
  const containerRef = useSafeRef((element) => {
    element.style.opacity = '0';
    element.style.transition = 'opacity 0.3s';
    element.offsetHeight;
    element.style.opacity = '1';

    return () => {
      element.style.opacity = '';
      element.style.transition = '';
    };
  });

  return <div ref={containerRef}>Content</div>;
}
```

### TypeScript: Use Non-Nullable Refs

```tsx
//  Allows null
const ref = useRef<HTMLDivElement>(null);

//  Better — but still null initially
const ref = useRef<HTMLDivElement | null>(null);

//  Best for callback refs
const ref = useRef<HTMLDivElement>(null!);  // Non-null assertion
```

**Warning:** The `null!` assertion tells TypeScript "trust me, this won't be null." Only use if you're 100% sure.

### Code Review Checklist

Before committing, check every `useEffect` that uses refs:

- Does the effect check if ref.current is null?
- Does the effect return a cleanup function?
- Does the cleanup undo everything the setup did?
- Are all dependencies in the dependency array correct?
- Is the ref used outside useEffect? (If yes, reconsider)

## 10. FAQ

**Q1: Is this a bug in React 18?**

No. This is intentional behavior. React 18's double mounting helps you catch real bugs that would appear in production with concurrent features.

**Q2: Is this a bug in Vite 5 or SWC?**

No. SWC is compiling your code correctly. If anything, Babel was being too lenient and hiding the bug.

**Q3: Should I disable Strict Mode?**

No. Only disable it temporarily for debugging. Keep it enabled in development. It catches real issues.

**Q4: Why didn't this happen in Create React App?**

CRA uses Babel, which has slightly different effect timing. Also, CRA's default Strict Mode behavior was different in older versions.

**Q5: Will this error happen in production?**

Only if your code has the same bug. Strict Mode double mounting is development-only. But if your effects don't clean up properly, you'll get memory leaks in production.

**Q6: Does this affect useLayoutEffect too?**

Yes. `useLayoutEffect` also runs twice in Strict Mode. The same fix applies.

**Q7: What about useCallback with refs?**

```jsx
const refCallback = useCallback((node) => {
  if (node !== null) {
    // Safe to use node
  }
}, []);
```

Callback refs are actually the safest pattern for complex DOM logic.

**Q8: I'm using a library that doesn't handle this. What do I do?**

Wrap the library component:

```jsx
function SafeWrapper() {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    // Initialize library here
  }, []);

  return <ThirdPartyComponent ref={ref} />;
}
```

**Q9: Does this affect React Native?**

React Native doesn't use DOM refs the same way, so this specific error is web-only. But the principle (always check before using refs) applies everywhere.

**Q10: Where can I learn more?**

- React 18 Strict Mode docs: https://react.dev/reference/react/StrictMode
- Vite 5 migration guide: https://vitejs.dev/guide/migration.html
- SWC documentation: https://swc.rs/

## Summary

| Problem | React 18 Strict Mode double-mounts components, making refs null temporarily |
|---------|-------------------------------------------------------------------------------|
| Trigger | Vite 5 + SWC exposes this more clearly than Babel |
| Quick Fix | Add `if (!ref.current) return;` |
| Proper Fix | Null check + cleanup function + callback refs for complex cases |
| Prevention | ESLint + custom hooks + code review checklist |

**If this helped you, share it with someone who's pulling their hair out over this error.**

Got a different variation of this error? Drop a comment below and I'll add it to the guide.

*Last updated: July 13, 2026*