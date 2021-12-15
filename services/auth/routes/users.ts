import express, { Request, Response, NextFunction } from 'express';
let router = express.Router();

/* GET users listing. */
router.get('/', function(req: Request, res: Response, next: NextFunction) {
  res.send('respond with a resource');
});

export const usersRouter = router;