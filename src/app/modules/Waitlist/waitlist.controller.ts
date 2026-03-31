import { Request, Response } from "express";
import Email from "./waitlist.model";


export const addEmail = async (req:Request, res:Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email required" });

  try {
    const existingEmail = await Email.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "This email is already on the waitlist!" });
    }

    const newEmail = new Email({ email });
    await newEmail.save();
    res.json({ message: "You have joined the waitlist!" });
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