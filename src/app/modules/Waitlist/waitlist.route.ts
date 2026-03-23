import express from "express";
import { addEmail, getEmails } from "./waitlist.controller";

const router = express.Router();

router.post("/add", addEmail); // public: submit email
router.get("/get", getEmails); // optional: get all emails

export const emailRouter = router;