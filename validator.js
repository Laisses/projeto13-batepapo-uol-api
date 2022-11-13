import Joi from "joi";

const validator = schema => payload =>
    schema.validate(payload, { abortEarly: false });

const messageSchema = Joi.object({
    to: Joi.string().min(1).required(),
    text: Joi.string().min(1).required(),
    type: Joi.valid("message", "private_message")
});

const participantSchema = Joi.object({
    name: Joi.string().min(1).required()
});

export const validateMessage = validator(messageSchema);

export const validateParticipant = validator(participantSchema);
