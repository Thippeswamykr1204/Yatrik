import { User } from "@/models/User.js";
import {
  generateTokens,
  verifyRefreshToken,
  hashRefreshToken,
  type TokenPayload,
} from "@/utils/tokens.js";
import {
  UnauthorizedError,
  ConflictError,
  DatabaseError,
  ValidationError,
} from "@/utils/errors.js";
import logger from "@/utils/logger.js";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface UserResponse {
  id: string;
  name: string;
  email: string;
}

interface AuthResponse {
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
}

/**
 * Register a new user
 */
export const registerUser = async (
  input: RegisterInput,
): Promise<AuthResponse> => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: input.email });
    if (existingUser) {
      throw new ConflictError("Email already registered");
    }

    // Create new user
    const user = new User({
      name: input.name,
      email: input.email,
      password: input.password,
    });

    // Save to database (password will be hashed by middleware)
    await user.save();

    // Generate tokens
    const tokenPayload: TokenPayload = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
    };

    const { accessToken, refreshToken } = generateTokens(tokenPayload);

    // Save refresh token to database
    user.refreshToken = hashRefreshToken(refreshToken);
    await user.save();

    logger.info("User registered");

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
      accessToken,
      refreshToken,
    };
  } catch (error) {
    if (error instanceof ConflictError || error instanceof ValidationError) {
      throw error;
    }
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      throw new ConflictError("Email already registered");
    }
    logger.error("Error registering user", { error });
    throw new DatabaseError("Failed to register user");
  }
};

/**
 * Login user with email and password
 */
export const loginUser = async (input: LoginInput): Promise<AuthResponse> => {
  try {
    // Find user by email
    const user = await User.findOne({ email: input.email }).select("+password");

    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    // Compare passwords
    const isPasswordValid = await user.comparePassword(input.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    // Generate new tokens
    const tokenPayload: TokenPayload = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
    };

    const { accessToken, refreshToken } = generateTokens(tokenPayload);

    // Save new refresh token to database
    user.refreshToken = hashRefreshToken(refreshToken);
    await user.save();

    logger.info("User logged in");

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
      accessToken,
      refreshToken,
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    logger.error("Error logging in user", { error });
    throw new DatabaseError("Failed to login");
  }
};

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async (
  refreshToken: string,
): Promise<{ accessToken: string; refreshToken: string }> => {
  try {
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Find user
    const user = await User.findById(decoded.id).select("+refreshToken");
    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    // Verify refresh token matches what's stored in database
    if (user.refreshToken !== hashRefreshToken(refreshToken)) {
      throw new UnauthorizedError("Refresh token does not match");
    }

    // Generate new tokens
    const tokenPayload: TokenPayload = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
    };

    const tokens = generateTokens(tokenPayload);

    // Compare-and-swap makes rotation single-use even across API replicas.
    const rotated = await User.updateOne(
      { _id: user._id, refreshToken: hashRefreshToken(refreshToken) },
      { $set: { refreshToken: hashRefreshToken(tokens.refreshToken) } },
    );
    if (rotated.modifiedCount !== 1)
      throw new UnauthorizedError("Refresh token already used");

    logger.info("Token refreshed");

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    if (error instanceof Error && error.message.includes("token")) {
      throw new UnauthorizedError(error.message);
    }
    logger.error("Error refreshing token", { error });
    throw new UnauthorizedError("Failed to refresh token");
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (id: string): Promise<UserResponse> => {
  try {
    const user = await User.findById(id);
    if (!user) {
      throw new UnauthorizedError("User not found");
    }
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    logger.error("Error fetching user", { error });
    throw new DatabaseError("Failed to fetch user");
  }
};

/**
 * Logout user (invalidate refresh token)
 */
export const logoutUser = async (userId: string): Promise<void> => {
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { refreshToken: null },
      { new: true },
    );

    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    logger.info("User logged out");
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    logger.error("Error logging out user", { error });
    throw new DatabaseError("Failed to logout");
  }
};
