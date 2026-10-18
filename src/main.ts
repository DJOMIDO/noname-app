import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import ConfigurationError from "./components/ConfigurationError.vue";
import router from "./router";
import { isNeonConfigured } from "./lib/neon";

const app = createApp(isNeonConfigured ? App : ConfigurationError);
if (isNeonConfigured) app.use(router);
app.mount("#app");
