import express from "express";

import { userRoutes } from "../modules/user/user.routes";
import { authRoutes } from "../modules/auth/auth.routes";
import { emailRouter } from "../modules/Waitlist/waitlist.route";


const router = express.Router();

const moduleRoutes = [
  {
    path: "/user",
    route: userRoutes,
  },
  {
    path: "/auth",
    route: authRoutes,
  },
  {
        path:"/waitlists",
    route:emailRouter
  }
  
  
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;