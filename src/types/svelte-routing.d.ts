declare module 'svelte-routing' {
  import { SvelteComponent } from 'svelte';

  export class Router extends SvelteComponent {
    $$prop_def: {
      url?: string;
    };
  }

  export class Link extends SvelteComponent {
    $$prop_def: {
      to: string;
      replace?: boolean;
      state?: { [key: string]: any };
      getProps?: (location: Location) => Record<string, any>;
    };
  }

  export class Route extends SvelteComponent {
    $$prop_def: {
      path?: string;
      component?: typeof SvelteComponent;
    };
  }

  export const link: (node: HTMLAnchorElement) => {
    update: (options: { to: string; replace?: boolean }) => void;
    destroy: () => void;
  };

  export const navigate: (
    to: string,
    {
      replace,
      state,
    }?: {
      replace?: boolean;
      state?: { [key: string]: any };
    }
  ) => void;
} 