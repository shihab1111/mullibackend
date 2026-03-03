/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose";
import { Post, Comment } from "./clubhouse.model";

export const createPostService = async (
  data: any,
  userId: string
): Promise<any> => {

  delete data.author;

  const post = await Post.create({
    ...data,
    author: userId,
  });

  return post;
};

export const getHomeFeedService = async (): Promise<any[]> => {
  const posts = await Post.find({ visibility: "public" })
    .populate("author", "name profileImage")
    .sort({ createdAt: -1 });

  return posts;
};

export const likePostService = async (
  user: any,
  postId: string
): Promise<{ totalLikes: number; liked: boolean }> => {

  const post = await Post.findById(postId);
  if (!post) throw new Error("Post not found");

  const userId = user.id.toString();

  const alreadyLiked = post.likes.some(
    (id: any) => id.toString() === userId
  );

  let updatedPost;

  if (alreadyLiked) {

    updatedPost = await Post.findByIdAndUpdate(
      postId,
      {
        $pull: { likes: userId },
        $inc: { likesCount: -1 }
      },
      { new: true }
    );
  } else {

    updatedPost = await Post.findByIdAndUpdate(
      postId,
      {
        $addToSet: { likes: userId },
        $inc: { likesCount: 1 }
      },
      { new: true }
    );
  }
  if (updatedPost!.likesCount < 0) {
    updatedPost!.likesCount = 0;
    await updatedPost!.save();
  }

  return {
    totalLikes: updatedPost!.likesCount,
    liked: !alreadyLiked,
  };
};

export const createCommentService = async (
  userId: string,
  postId: string,
  payload: any
): Promise<any> => {
  const { text } = payload;

  const isPostExist = await Post.findById(postId);
  if (!isPostExist) {
    throw new Error("Post not found");
  }

  const result = await Comment.create({
    user: userId,
    post: postId,
    text,
  
  });

  // Increment comment count in Post
  await Post.findByIdAndUpdate(postId, {
    $inc: { commentsCount: 1 },
  });

  return result;
};

export const getCommentsByPostService = async (postId: string): Promise<any[]> => {
  const result = await Comment.find({ post: postId, parentId: null })
    .populate("user", "name profileImage skillLevel")
    .sort({ createdAt: -1 });

  const commentsWithReplies = await Promise.all(
    result.map(async (comment) => {
      const replies = await Comment.find({ parentId: comment._id })
    .populate("user", "name profileImage skillLevel")
    .sort({ createdAt: 1 });
      return {
        ...comment.toJSON(),
        replies,
      };
    })
  );

  return commentsWithReplies;
};

export const  likeCommentService = async (
  userId: string,
  commentId: string
): Promise<any> => {
  
  const comment = await Comment.findById(commentId);
  
  if (!comment) {
    throw new Error("Comment not found");
  }
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const isLiked = comment.likes.some((id) => id.equals(userObjectId));

  let updatedComment;

  if (isLiked) {
    updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      {
        $pull: { likes: userObjectId },
        $inc: { likesCount: -1 },
      },
      { new: true }
    ).populate("user", "name profileImage"); 
  } else {

    updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      {
        $addToSet: { likes: userObjectId },
        $inc: { likesCount: 1 },
      },
      { new: true }
    ).populate("user", "name profileImage");
  }

  return updatedComment;
};

export const sendGiftService = async (
  user: any,
  postId: string,
  giftType: string
): Promise<any> => {
  const updated = await Post.findByIdAndUpdate(
    postId,
    {
      $push: {
        gifts: { user: user.id, giftType, sentAt: new Date() },
      },
    },
    { new: true }
  );

  if (!updated) {
    throw new Error("Post not found");
  }

  return updated;
};

export const postServices = {
  createPostService,
  getHomeFeedService,
  likePostService,
  sendGiftService,
  createCommentService,
  getCommentsByPostService,
  likeCommentService,
};

