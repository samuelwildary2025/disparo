import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  legacyHeaders: false,
  standardHeaders: true,
  message: "Muitas tentativas, tente novamente em alguns minutos."
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  legacyHeaders: false,
  standardHeaders: true,
  message: "Limite de requisições atingido."
});
