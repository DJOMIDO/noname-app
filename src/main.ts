import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import ConfigurationError from "./components/ConfigurationError.vue";
import router from "./router";
import { isSupabaseConfigured } from "./lib/supabase";
import "leaflet/dist/leaflet.css";

import L from "leaflet";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL(
    "leaflet/dist/images/marker-icon-2x.png",
    import.meta.url
  ).href,
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).href,
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url)
    .href,
});

const app = createApp(isSupabaseConfigured ? App : ConfigurationError);
if (isSupabaseConfigured) app.use(router);
app.mount("#app");
