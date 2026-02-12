import request from 'supertest';
import app from '../../app';
import { UserModel } from '../../models/user.model';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../config';

