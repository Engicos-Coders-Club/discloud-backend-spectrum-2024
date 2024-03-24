import { Event } from '../models/Event.js';
import { StatusCodes } from 'http-status-codes';
import { BadRequestError, CustomAPIError, NotFoundError, UnauthenticatedError } from '../errors/index.js';
import { Participants } from '../models/Participant.js';
import { Team } from '../models/Team.js';
import { sendOtpEmail } from '../helper/email-otp/zeptomail.js';
import cloudinary from "cloudinary";
import { participantRegisteredTemplate, teamRegistrationAdminUpdateTemplate } from '../helper/email-template.js';
export const createTeam = async (req, res) => {
    const { teamName, eventId, leader, participants, payment_screenshot } = req.body;
    if (!teamName || !eventId || !leader || !participants || !payment_screenshot)
        throw new BadRequestError("'teamName' 'eventId' 'leader' 'participants' 'payment_screenshot' cannot be empty");
    const event = await Event.findOne({ _id: eventId });
    if (!event)
        throw new NotFoundError(`No event with id ${eventId}`);
    const limit = event.participationLimit;
    if (limit != -1) {
        const entries = await Team.find({ eventId: eventId });
        if (entries.length >= limit)
            throw new CustomAPIError("Participation limit reached", StatusCodes.FORBIDDEN);
    }
    if (event.teamSize.max < participants.length && participants.length < event.teamSize.min)
        throw new BadRequestError(`Invalid number of participants, Max:${event.teamSize.max}, Min:${event.teamSize.min}`);
    const emails = participants.map((participant) => participant.email);
    if (!emails.includes(leader))
        throw new BadRequestError("Leader should be part of team");
    const temp = [];
    emails.forEach((ele) => {
        if (temp.includes(ele))
            throw new BadRequestError("Duplicate email");
        temp.push(ele);
    });
    if (!(payment_screenshot.startsWith('data:')))
        throw new BadRequestError('payment_screenshot must be base64 encoded');
    const result = await cloudinary.v2.uploader.upload(payment_screenshot, { resource_type: "image" });
    const team = await Team.create({ teamName, eventId, leader, participants: emails, payment_screenshot: result.secure_url });
    participants.forEach(async (ele) => {
        if (!ele.email || !ele.name || !ele.contact || !ele.idcard)
            throw new BadRequestError("'email' 'name' 'contact' 'idcard' 'college' cannot be empty inside participants");
        if (!(ele.idcard.startsWith('data:')))
            throw new BadRequestError('idcard must be base64 encoded');
        const temp = await Participants.find({ email: ele.email });
        if (temp.length == 0) {
            const result = await cloudinary.v2.uploader.upload(ele.idcard, { resource_type: "image" });
            await Participants.create({ email: ele.email, name: ele.name, idcard: result.secure_url, contact: ele.contact, college: ele.college });
        }
        await Participants.findOneAndUpdate({ email: ele.email }, { $push: { events: eventId, teams: team } });
    });
    const data = participantRegisteredTemplate(event.eventName, teamName);
    const adminData = teamRegistrationAdminUpdateTemplate(event.eventName, teamName);
    sendOtpEmail(leader, '', teamName, data.htmlBody, data.subjectBody, true);
    sendOtpEmail("gecstudentscouncil@gmail.com", '', "Spectrum 2024 Admin", adminData.htmlBody, adminData.subjectBody, true);
    res.status(StatusCodes.OK).json({ msg: "Team Added" });
};
export const getTeams = async (req, res) => {
    const { eventId } = req.params;
    const department = req.user?.department;
    const isAdmin = req.user?.isAdmin;
    const event = await Event.findById(eventId);
    if (!event)
        throw new NotFoundError(`No event with id ${eventId}`);
    if (department != event.departmentId && !isAdmin)
        throw new UnauthenticatedError("You do not belong to the department of this event");
    const teams = await Team.find({ eventId: eventId });
    res.status(StatusCodes.OK).json(teams);
};
export const getTeamsWhole = async (req, res) => {
    const { eventId } = req.params;
    const department = req.user?.department;
    const isAdmin = req.user?.isAdmin;
    const event = await Event.findById(eventId);
    if (!event)
        throw new NotFoundError(`No event with id ${eventId}`);
    if (department != event.departmentId && !isAdmin)
        throw new UnauthenticatedError("You do not belong to the department of this event");
    const teams = await Team.find({ eventId: eventId });
    //couple all the participant objs with the team obj and return the data if detailed is true else only return team objs
    const participantPromises = teams.map(async (team) => {
        const participantEmails = team.participants;
        const participantPromises = participantEmails.map(async (email) => {
            return await Participants.find({ email: email });
        });
        const participants = await Promise.all(participantPromises);
        //return an array of teams with participants, [team:praticipant[],team:praticipant[]]
        return { team: team, participants: participants }; //returns 
    });
    const teamsWithParticipants = await Promise.all(participantPromises);
    res.status(StatusCodes.OK).json(teamsWithParticipants);
};
export const getTeam = async (req, res) => {
    const { teamId } = req.params;
    const department = req.user?.department;
    const isAdmin = req.user?.isAdmin;
    if (!department && !isAdmin)
        throw new UnauthenticatedError("You dont have authority to perform this action");
    const team = await Team.find({ _id: teamId });
    if (team.length === 0)
        throw new NotFoundError(`No team with id ${teamId}`);
    const participantEmails = team[0].participants;
    const participantPromises = participantEmails.map(async (email) => {
        return await Participants.find({ email: email });
    });
    const participants = await Promise.all(participantPromises);
    res.status(StatusCodes.OK).json({ "team": team[0], "participants": participants });
};
export const getParticipant = async (req, res) => {
    const { email } = req.body;
    if (!email)
        throw new BadRequestError("'email' should be given as query params");
    const participant = await Participants.findOne({ email: email });
    if (!participant)
        throw new NotFoundError(`No participant with email ${email}`);
    // add all the teams the pariticipant belongs to in the participant object before sending it
    const teamPromises = participant.teams.map(async (teamId) => {
        return await Team.find({ _id: teamId });
    });
    res.status(StatusCodes.OK).json(participant);
};