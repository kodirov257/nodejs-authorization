import { Request, Response } from 'express';

export interface ContextModel {
    res: Response;
    req: Request;
}