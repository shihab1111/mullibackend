/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import { chatService } from "./chat.service";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../../utils/catchAsync";
import { fileUploader } from "../../helpers/fileUpload";

import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/sendResponse";

const sendMessage = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { receiverId } = req.params;
    const user = req.user as JwtPayload;

    const files = req.files as Express.Multer.File[] | undefined;
    let imageUrl = "";

    if (files && files.length > 0) {
      const uploadResult = await fileUploader.uploadToCloudinary(files[0]);
      if (uploadResult) {
        imageUrl = uploadResult.secure_url;
      }
    }

    const messageData = {
      ...req.body,
      message: {
        ...req.body.message,
        image: imageUrl,
      },
    };

    const result = await chatService.sendMessageService(
      user,
      receiverId as string,
      messageData,
    );

    // send response
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Message sent successfully!",
      data: result,
    });
  },
);

const getConversations = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;

  const chats = await chatService.getConversationsService(user);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Conversations fetched successfully",
    data: chats,
  });
});

const getMessages = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const { otherUserId } = req.params;

  const messages = await chatService.getMessagesService(
    user,
    otherUserId as string,
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Messages fetched successfully",
    data: messages,
  });
});


export const ChatController = {
  sendMessage,
  getConversations,
  getMessages,

};
