<script lang="ts">
  import { Router, Link, Route } from "svelte-routing";
  import Home from "./routes/Home.svelte";
  import Learn from "./routes/Learn.svelte";
  import Profile from "./routes/Profile.svelte";
  import Navbar from "./components/Navbar.svelte";
  import "./app.css";

  export let url = "";
</script>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
  <Router {url}>
    <Navbar />
    <main class="container mx-auto px-4 py-8 pt-20">
      <Route path="/" component={Home} />
      <Route path="/learn" component={Learn} />
      <Route path="/profile" component={Profile} />
    </main>
  </Router>
</div>

<style>
  :global(body) {
    margin: 0;
    font-family: Inter var, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif;
  }
</style>
