import { Department } from '../models/Department.js';
import { Coordinator } from '../models/Coordinator.js';
import { Event } from '../models/Event.js';
import { StatusCodes } from 'http-status-codes';
import { BadRequestError, NotFoundError } from '../errors/index.js';
export const addDepartment = async (req, res) => {
    const { name } = req.body;
    if (!name)
        throw new BadRequestError("Department name 'name' was not provided");
    await Department.create(req.body);
    res.status(StatusCodes.OK).json({ msg: "Department Added" });
};
export const getDepartmentName = async (req, res) => {
    const userId = req.user?.userId;
    const department = req.user?.department;
    if (!userId) { // implies admin is accessing route
        throw new BadRequestError("Admin does not belong to a department");
    }
    const dept = await Department.findOne({ _id: department });
    res.status(StatusCodes.OK).json({ dept });
};
export const assignEvent = async (req, res) => {
    const { eventId, coordinatorEmail } = req.body;
    const event = await Event.findById(eventId);
    if (!event)
        throw new NotFoundError(`No event with id ${eventId}`);
    await Coordinator.findOneAndUpdate({ email: coordinatorEmail }, { $push: { events: eventId } });
    res.status(StatusCodes.OK).json({ msg: "Event Assigned" });
};
export const getCoordinatorsForEvent = async (req, res) => {
    const { eventId } = req.params;
    if (!eventId)
        throw new BadRequestError("'eventId' cannot be empty");
    const coordinators = await Coordinator.find({ events: { $in: [eventId] } });
    res.status(StatusCodes.OK).json({ coordinators });
};
