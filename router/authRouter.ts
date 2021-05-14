import { Router } from '../deps.ts'
import { signup } from '../controllers/auth.ts';

export const authRouter = new Router({ prefix: '/auth' })

authRouter.post('/signup', signup)