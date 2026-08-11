import { NextFunction, Request, Response } from "express";
import { AnyZodObject } from "zod";

interface Schemas {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
}

// Validates req.body / req.query / req.params against zod schemas and
// replaces them with the parsed (and type-coerced) values. Throws ZodError
// on failure, which errorHandler turns into a 400 response.
export function validate(schemas: Schemas) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (schemas.body) req.body = schemas.body.parse(req.body);
    if (schemas.query) req.query = schemas.query.parse(req.query) as any;
    if (schemas.params) req.params = schemas.params.parse(req.params) as any;
    next();
  };
}
