import express from 'express';
import { DashboardController } from './dashboard.controller';

const router = express.Router();

router.get('/data', DashboardController.getDashboardStats);
router.get('/clubhouse-weekly-engagement', DashboardController.getClubhouseWeeklyEngagement);
router.get('/clubhouse-reports', DashboardController.getClubhouseReports);

export const dashboardRoutes = router;
