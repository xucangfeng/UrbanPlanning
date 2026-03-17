import { createBrowserRouter } from "react-router";
import DashboardLayout from "./components/DashboardLayout";
import Panorama from "./pages/Panorama";
import Optimization from "./pages/Optimization";
import Diagnostics from "./pages/Diagnostics";
import Simulation from "./pages/Simulation";
import Monitoring from "./pages/Monitoring";

// Router configuration for the urban planning dashboard
export const router = createBrowserRouter([
  {
    path: "/",
    Component: DashboardLayout,
    children: [
      { index: true, Component: Panorama },
      { path: "act1", Component: Diagnostics },
      { path: "optimization", Component: Optimization },
      { path: "act3", Component: Simulation },
      { path: "act4", Component: Monitoring },
    ],
  },
]);
