import express, { NextFunction, Request, Response } from 'express';
let router = express.Router();

/* GET home page. */
router.get('/', function(req: Request, res: Response, next: NextFunction) {
  res.send({ title: 'Express' });
});

export const indexRouter = router;
