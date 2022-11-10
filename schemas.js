import Joi from "joi";

const messageSchema = Joi.object({
    to: Joi.string().min(1).required(),
    text: Joi.string().min(1).required(),
    type: Joi.valid("message", "private_message")
});

const participantSchema = Joi.object({
    user: Joi.string().min(1).required()
});