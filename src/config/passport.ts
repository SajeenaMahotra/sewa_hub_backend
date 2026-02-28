import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { UserModel } from "../models/user.model";
// ✅ Remove JWT_SECRET import - not needed here

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            callbackURL: `${process.env.SERVER_URL || "http://localhost:5050"}/api/auth/google/callback`,
            passReqToCallback: true,
        },
        async (req, accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails?.[0].value;
                const imageUrl = profile.photos?.[0].value;

                if (!email) return done(new Error("No email from Google"), undefined);

                let user = await UserModel.findOne({
                    $or: [{ googleId: profile.id }, { email }]
                });

                if (user) {
                    if (!user.googleId) {
                        // ✅ use updateOne to avoid type error
                        await UserModel.updateOne(
                            { _id: user._id },
                            { $set: { googleId: profile.id } }
                        );
                    }
                    return done(null, user);
                }

                const role = (req.query.state as string) === "provider" ? "provider" : "user";

                user = await UserModel.create({
                    fullname: profile.displayName,
                    email,
                    googleId: profile.id,
                    imageUrl,
                    role,
                    isProfileSetup: false,
                });

                return done(null, user);
            } catch (error) {
                return done(error as Error, undefined);
            }
        }
    )
);

export default passport;