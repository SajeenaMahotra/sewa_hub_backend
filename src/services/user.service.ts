import { CreateUserDTO, LoginUserDTO } from "../dtos/user.dto";
import { UserRepository } from "../repositories/user.repository";
import  bcryptjs from "bcryptjs"
import { HttpError } from "../errors/http-error";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";

let userRepository = new UserRepository();

export class UserService {
    async createUser(data: CreateUserDTO){
        const emailCheck = await userRepository.getUserByEmail(data.email);
        if(emailCheck){
            throw new HttpError(403, "Email already in use");
        }
        const hashedPassword = await bcryptjs.hash(data.password, 10); // 10 - complexity
        data.password = hashedPassword;

        const newUser = await userRepository.createUser(data);
        return newUser;
    }

    async loginUser(data: LoginUserDTO){
        const user =  await userRepository.getUserByEmail(data.email);
        if(!user){
            throw new HttpError(404, "User not found");
        }
        const validPassword = await bcryptjs.compare(data.password, user.password);
        if(!validPassword){
            throw new HttpError(401, "Invalid credentials");
        }
        // generate jwt
        const payload = {
            id: user._id,
            fullname: user.fullname,
            email: user.email,
            role: user.role
        }
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' }); 
        return { token, user }
    }
}