import { NextFunction, Request, Response } from "express";

type AsyncControllerType = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

export const asyncHandler =
  (controller: AsyncControllerType): AsyncControllerType =>
  (req, res, next) => {
    return Promise.resolve(controller(req, res, next)).catch(next);
  };

export const catchAsync = asyncHandler;

export default asyncHandler;
