import { Router } from 'express';
let indexRouter = Router();

/* GET http://localhost:8000/ returns index.html */
indexRouter.get('/', function(req, res) {
    res.render('index.html', { title: 'Home' });
});

export default indexRouter;
