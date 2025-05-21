import { createRouter, createWebHistory } from "vue-router";
import Home from "@/components/Home.vue";
import Login from "@/components/Login.vue";
import Signup from "@/components/Signup.vue";
import NotFound from "@/components/NotFound.vue";
import AddFlight from "@/components/AddFlight.vue";
import AddTrain from "@/components/AddTrain.vue";
import ViewJourneys from "@/components/ViewJourneys.vue";
import Stats from "@/components/Stats.vue";

const routes = [
  { path: "/", redirect: "/home" },
  { path: "/login", component: Login },
  { path: "/signup", component: Signup },
  { path: "/home", component: Home },
  { path: "/:pathMatch(.*)*", component: NotFound },
  { path: "/add-flight", component: AddFlight },
  { path: "/add-train", component: AddTrain },
  { path: "/journeys", component: ViewJourneys },
  {
    path: "/journeys/flight/:id",
    name: "FlightDetails",
    component: () => import("@/views/FlightDetails.vue"),
  },
  {
    path: "/journeys/train/:id",
    name: "TrainDetails",
    component: () => import("@/views/TrainDetails.vue"),
  },
  { path: "/stats", component: Stats },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
