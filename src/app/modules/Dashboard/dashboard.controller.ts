import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { DashboardService } from './dashboard.service';

const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const result = await DashboardService.getDashboardStats();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Dashboard stats retrieved successfully',
    data: result,
  });
});

const getClubhouseWeeklyEngagement = catchAsync(async (req: Request, res: Response) => {
  const result = await DashboardService.getClubhouseWeeklyEngagement();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Clubhouse weekly engagement retrieved successfully',
    data: result,
  });
});

const getClubhouseReports = catchAsync(async (req: Request, res: Response) => {
  const result = await DashboardService.getClubhouseReports();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Clubhouse reports retrieved successfully',
    data: result,
  });
});

export const DashboardController = {
  getDashboardStats,
  getClubhouseWeeklyEngagement,
  getClubhouseReports,
};
