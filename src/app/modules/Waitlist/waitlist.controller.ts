import { Request, Response } from "express";
import Email from "./waitlist.model";


export const addEmail = async (req:Request, res:Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email required" });

  try {
    const newEmail = new Email({ email });
    await newEmail.save();
    res.json({ message: "Email saved!" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getEmails = async (req:Request, res:Response) => {
  try {
    const emails = await Email.find().sort({ createdAt: -1 });
    res.json(emails);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};