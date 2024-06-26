import { Schema, model } from 'mongoose';
// Subschema for coordinator information
const CoordinatorSchema = new Schema({
    name: { type: String, required: true },
    contact: { type: String, required: true,
        match: [
            /^\d{10}$/,
            'Please provide a valid 10-digit contact number'
        ] }
});
// Subschema for rules and regulations
const RuleSchema = new Schema({
    topic: { type: String, required: true },
    points: { type: [String], required: true }
});
// Main Event schema
const EventSchema = new Schema({
    eventName: { type: String, required: true },
    fee: { type: Number, required: true, default: 0 },
    imageURL: { type: String, default: "" },
    introduction: { type: String, required: true },
    departmentId: { type: String, required: true },
    prices: {
        firstPlace: { type: Number, required: true },
        secondPlace: { type: Number, required: true }
    },
    date: { type: Date, required: true },
    teamSize: {
        min: { type: Number, required: true },
        max: { type: Number, required: true }
    },
    participationLimit: { type: Number, default: -1 },
    contact: {
        coordinators: { type: [CoordinatorSchema], required: true }
    },
    rulesAndRegulations: { type: [RuleSchema], required: true },
    duration: { type: String, required: true },
    rulebook: { type: String, default: "" }
});
// Create and export the Event model
export const Event = model('Event', EventSchema);
