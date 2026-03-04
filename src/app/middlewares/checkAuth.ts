import { NextFunction, Request, Response } from "express";
import AppError from "../errorHelpers/AppError";
import { verifyToken } from "../utils/jwt";
import { envVars } from "../config/env";
import { JwtPayload } from "jsonwebtoken";
import httpStatus from "http-status-codes";
import { User } from "../modules/user/user.model";
import { IsActive } from "../modules/user/user.interface";

export const checkAuth =
  (...authRoles: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let accessToken: string | undefined;
      if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer ")
      ) {
        accessToken = req.headers.authorization.split(" ")[1];
  
      }
      if (!accessToken && req.cookies?.accessToken) {
        accessToken = req.cookies.accessToken;
      }

      if (!accessToken) {
        throw new AppError(403, "No Token Received");
      }

      const verifiedToken = verifyToken(
        accessToken,
        envVars.JWT_ACCESS_SECRET
      ) as JwtPayload;

   
      const user = await User.findOne({
        email: verifiedToken.email,
      });

      if (!user) {
        throw new AppError(httpStatus.BAD_REQUEST, "User does not exist");
      }

      if (
        user.isActive === IsActive.BLOCKED ||
        user.isActive === IsActive.INACTIVE
      ) {
        throw new AppError(httpStatus.BAD_REQUEST, `User is ${user.isActive}`);
      }

      if (user.isDeleted) {
        throw new AppError(httpStatus.BAD_REQUEST, "User is deleted");
      }

      if (authRoles.length && !authRoles.includes(user.role)) {
        throw new AppError(
          403,
          "You are not permitted to view this route!!!"
        );
      }

      req.user = {
        id: user._id,
        email: user.email || "",
        role: user.role,
        firstName: user.name || "",
        isActive: user.isActive,
  
      };

      next();
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        return next(new AppError(401, "Token expired"));
      }

      if (error.name === "JsonWebTokenError") {
        return next(new AppError(401, "Invalid token"));
      }

      next(error);
    }
  };
