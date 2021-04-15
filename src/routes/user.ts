import {NextFunction, Request, Response, Router} from 'express';
import sequelize from '../sequelize';
import jwt from 'jsonwebtoken';

export const requiresAuth = async (request: Request, response: Response, next: NextFunction) => {
	const bearer: string = request.headers.authorization;
	if (bearer.trim()) {
		const secret: string = bearer.replace(/^Bearer /m, '');

		// Currently, this is just checking for the existence of a non-deleted user
		try {
			jwt.verify(secret, process.env.JWT_SECRET);
			const result = await sequelize.model('User').findOne({
				where: {
					secret
				},
				attributes: ['deletedAt']
			});
			if (result && !result.deletedAt) {
				next();
				return;
			}
		} catch (error: unknown) {
			if (error instanceof jwt.JsonWebTokenError) {
				response.status(401).end();
				return;
			}
		}
	}

	response.status(401).end();
};

export const requiresAdmin = async (request: Request, response: Response, next: NextFunction) => {
	const bearer: string = request.headers.authorization;
	if (bearer.trim()) {
		const secret: string = bearer.replace(/^Bearer /m, '');

		// Currently, this is just checking for the existence of a non-deleted user
		try {
			jwt.verify(secret, process.env.JWT_SECRET);
			const result = await sequelize.model('User').findOne({
				where: {
					secret
				},
				attributes: ['role', 'deletedAt']
			});
			if (result && !result.deletedAt && result['role'] === 'admin') {
				next();
				return;
			}

			response.status(403).end();
			return;
		} catch (error: unknown) {
			if (error instanceof jwt.JsonWebTokenError) {
				response.status(401).end();
				return;
			}
		}
	}

	response.status(401).end();
};

const routes = (app: Router) => {
	app.post('/user', requiresAdmin, async (request: Request, response: Response) => {
		const {email, role} = request.body;
		// Create a jwt secret
		const secret: string = jwt.sign({email, role}, process.env.JWT_SECRET, {
			algorithm: 'HS256'
		});
		const result = await sequelize.model('User').create({email, role, secret});
		return response.status(200).json({
			message: 'ok',
			result
		});
	});
	app.get('/users', requiresAdmin, async (_request: Request, response: Response) => {
		const result: any = await sequelize.model('User').findAll({
			attributes: ['email', 'role', 'secret']
		});
		return response.status(200).json({
			message: 'ok',
			result
		});
	});
	app.delete('/user/:id', requiresAdmin, async (request: Request, response: Response) => {
		const {id} = request.params;
		const result = await sequelize.model('User').destroy({
			where: {
				id
			}
		});
		return response.status(200).json({
			message: 'ok',
			result
		});
	});
};

export default routes;
