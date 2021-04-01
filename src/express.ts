import bodyParser from 'body-parser';
import express, { Request, Response } from 'express';
import errorhandler from 'strong-error-handler';
import sequelize from './sequelize';
import jwt from 'jsonwebtoken'

export const app = express();

app.use(bodyParser.json());

const notImplemented = async (_request: Request, response: Response) => response.status(501).json({ message: 'Not implemented' });

app.get('/', (_request: Request, response: Response) => {
  return response.status(200).json({
    message: 'Episodes.fm'
  });
});

app.get('/platforms', async (_request: Request, response: Response) => {
  const result: any = await sequelize.model('Platform').findAll();
  return response.status(200).json({
    message: 'ok',
    result
  });
});

app.post('/platform', async (request: Request, response: Response) => {
  const { name, platformId, urlTemplateString } = request.body
  const result = await sequelize.model('Platform').create({ name, platformId, urlTemplateString })
  return response.status(200).json({
    message: 'ok',
    result
  });
});
app.delete('/platform/:id', async (request: Request, response: Response) => {
  const { id } = request.params
  const result = await sequelize.model('Platform').destroy({
    where: {
      id
    }
  })
  return response.status(200).json({
    message: 'ok',
    result
  });
});


app.post('/user', async (request: Request, response: Response) => {
  const { email, role } = request.body
  // create a jwt secret
  const secret: string = jwt.sign({ email, role }, process.env.JWT_SECRET, {
    algorithm: "HS256"
  })
  const result = await sequelize.model('User').create({ email, role, secret })
  return response.status(200).json({
    message: 'ok',
    result
  });
});
app.get('/users', async (_request: Request, response: Response) => {
  const result: any = await sequelize.model('User').findAll({
    attributes: ['email', 'role']
  });
  return response.status(200).json({
    message: 'ok',
    result
  });
});
app.delete('/user/:id', async (request: Request, response: Response) => {
  const { id } = request.params
  const result = await sequelize.model('User').destroy({
    where: {
      id
    }
  })
  return response.status(200).json({
    message: 'ok',
    result
  });
});

app.get('/episodes/lookup/:url', notImplemented);

app.use((_request: Request, response: Response) => {
  return response.status(404).json({
    error: 'Not Found'
  });
});

app.use(errorhandler({
  debug: process.env.ENV !== 'prod',
  log: true
}));

