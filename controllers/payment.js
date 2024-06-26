import { StatusCodes } from 'http-status-codes';
import { NotFoundError, UnauthenticatedError } from '../errors/index.js';
import { Team } from '../models/Team.js';
import { Event } from '../models/Event.js';
import { emailDefaultPaymentConfirmation } from '../helper/email-template.js';
import { sendOtpEmail } from '../helper/email-otp/index.js';
import cloudinary from 'cloudinary';
export const checkPaymentStatus = async (req, res) => {
    const { teamId } = req.params;
    const team = await Team.findById(teamId);
    if (!team)
        throw new NotFoundError(`No event with id ${teamId}`);
    res.status(StatusCodes.OK).json({ "payment_status": team.paid });
};
export const updatePaymentStatus = async (req, res) => {
    const { teamId } = req.params;
    const department = req.user?.department;
    const isAdmin = req.user?.isAdmin;
    if (!department && !isAdmin)
        throw new UnauthenticatedError("You dont have authority to perform this action");
    const team = await Team.findByIdAndUpdate(teamId, { paid: true });
    const event = await Event.findById(team?.eventId);
    const eventName = event?.eventName;
    const teamName = team?.teamName;
    const teamLeaderEmail = team?.leader;
    //finds the email of the team leader and sends them an email confirming their entry
    //by sending an email like sendOtpEmail(email=teamLeaderEmail, name=teamName, message="Your payment has been successfull and your team ${teamName} has succesfully been added as a team", subject="Payment Confirmation For ${eventName}");
    const data = emailDefaultPaymentConfirmation(eventName, teamName);
    sendOtpEmail(teamLeaderEmail, '', teamName, data.htmlBody, data.subjectBody, true);
    if (!team)
        throw new NotFoundError(`No team with id ${teamId}`);
    res.status(StatusCodes.OK).json({ "msg": "Payment Status Updated" });
};
export const uploadPaymentReceipt = async (req, res) => {
    const { teamId } = req.params;
    // wont save image if event does not exist
    const team = await Team.findById(teamId);
    if (!team)
        throw new NotFoundError(`No team with id ${teamId}`);
    const file = req.file;
    const dataUrl = `data:image/jpeg;base64,${file.buffer.toString('base64')}`;
    const result = await cloudinary.v2.uploader.upload(dataUrl, { resource_type: "image" });
    // storing url in db
    await Team.findByIdAndUpdate(teamId, { payment_screenshot: result.secure_url });
    res.status(StatusCodes.OK).json({ msg: "payment receipt uploaded" });
};
