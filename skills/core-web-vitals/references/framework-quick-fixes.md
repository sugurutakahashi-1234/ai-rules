# Framework quick fixes

Short per-framework starting points for LCP / INP / CLS. See SKILL.md for the reasoning behind each fix.


## Next.js

```jsx
// LCP: Use next/image with priority
import Image from "next/image";
<Image src="/hero.jpg" priority fill alt="Hero" />;

// INP: Use dynamic imports
const HeavyComponent = dynamic(() => import("./Heavy"), { ssr: false });

// CLS: Image component handles dimensions automatically
```

## React

```jsx
// LCP: Preload in head
<link rel="preload" href="/hero.jpg" as="image" fetchpriority="high" />;

// INP: Memoize and useTransition
const [isPending, startTransition] = useTransition();
startTransition(() => setExpensiveState(newValue));

// CLS: Always specify dimensions in img tags
```

## Vue/Nuxt

```vue
<!-- LCP: Use nuxt/image with preload -->
<NuxtImg src="/hero.jpg" preload loading="eager" />

<!-- INP: Use async components -->
<component :is="() => import('./Heavy.vue')" />

<!-- CLS: Use aspect-ratio CSS -->
<img :style="{ aspectRatio: '16/9' }" />
```

