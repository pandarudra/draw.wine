import { Router } from "express";
import { sendInvitations } from "../controllers/rooms.controller";

const roomRouter = Router();

// POST /api/rooms/send-invitations
roomRouter.post("/send-invitations", sendInvitations);

export default roomRouter;
