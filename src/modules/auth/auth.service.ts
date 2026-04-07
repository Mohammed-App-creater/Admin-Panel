// src/modules/auth/auth.service.ts
import prisma from "../../config/prisma";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { ENV } from "../../config/env";
import { UserStatus, VerificationStatus } from "@prisma/client";
import { sendResetEmail } from "../../utils/mailer";
import { NotificationService } from "../notification/notification.service";
import {normalizeEthiopianPhone} from "../../utils/normalization";


function generateCode(): string {
  return crypto.randomBytes(3).toString("hex").toUpperCase(); // 6-character hex code
}

export const register = async (data: any) => {
  const { fullName, phone, email, password, role, location } = data;
  // Normalize phone number
  const normalizedPhone = normalizeEthiopianPhone(phone);
  // Check if user already exists
  const existingUser = email ? await prisma.user.findUnique({ where: { email } }) : false || await prisma.user.findUnique({ where: { phone: normalizedPhone } });
  if (existingUser) {
    throw new Error("User already exists with this email or phone number");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      fullName,
      phone,
      email,
      passwordHash,
      role,
      location,
      status: UserStatus.PENDING,
      verification: VerificationStatus.PENDING,
      referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
    },
  });

  return user;
};

export const login = async (data: any) => {
  const { phone, password } = data;
  // Normalize phone number
  const normalizedPhone = normalizeEthiopianPhone(phone);
  const user = await prisma.user.findUnique({ where: { phone: normalizedPhone } });
  if (!user) throw new Error("Invalid phone number or password");
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error("Invalid phone number or password");

  // if (user.status === "INACTIVE") throw new Error("Account is deactivated");
  // if (user.verification !== "APPROVED") throw new Error("Account not verified by admin");

  await prisma.user.update({
    where: { id: user.id },
    data: { tokenVersion: 0 },
  });
  // User profile
  if (user.role === "WORKER") {
    const worker = await prisma.worker.findUnique({ where: { userId: user.id } });
    if (!worker) throw new Error("Worker profile not found");
    return {
      token: jwt.sign(
        { id: user.id, role: user.role, email: user.email, tv: user.tokenVersion },
        ENV.JWT_SECRET,
        { expiresIn: "7d" }
      ), user, worker
    };
  } else if (user.role === "COMPANY") {
    const company = await prisma.company.findUnique({ where: { userId: user.id } });
    if (!company) throw new Error("Company profile not found");
    return {
      token: jwt.sign(
        { id: user.id, role: user.role, email: user.email, tv: user.tokenVersion },
        ENV.JWT_SECRET,
        { expiresIn: "7d" }
      ), user, company
    };
  } else if (user.role === "ADMIN") {
    return {
      token: jwt.sign(
        { id: user.id, role: user.role, email: user.email, phone: user.phone, tv: user.tokenVersion },
        ENV.JWT_SECRET,
        { expiresIn: "7d" }
      ), user
    };
  }

};

export const logout = async (userId: string) => {
  await prisma.user.update({
    where: { id: userId },
    data: { tokenVersion: { increment: 1 } },
  });

  return { message: "Logged out successfully" };
};


export const activateUser = async (userId: string) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      status: UserStatus.ACTIVE,
    },
  });
  await NotificationService.notifyUser(
    userId,
    "Your application has been approved",
    `Congratulations ${user.fullName}, your account has been approved.`,
    "JOB_RESPONSE"
  );
}

export const deactivateUser = async (userId: string) => {
  return prisma.user.update({
    where: { id: userId },
    data: {
      status: UserStatus.INACTIVE,
    },
  });
}

export const approveUser = async (userId: string) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      verification: VerificationStatus.APPROVED,
    },
  });

  (async () => {
    try {
      if (user.email) {
        await sendResetEmail(
          user.email,
          "Your account has been approved by admin. You can now log in and start using our services."
        );
      }
    } catch (error) {
      console.error("Error sending email:", error);
    }
  })();

  (async () => {
    try {
      await NotificationService.notifyUser(
        userId,
        "Your application has been approved",
        `Congratulations ${user?.fullName}, your account has been approved.`,
        "ALERT"
      );
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  })();

  return user;
};

export const rejectUser = async (userId: string) => {
  return prisma.user.update({
    where: { id: userId },
    data: {
      verification: VerificationStatus.REJECTED,
    },
  });
};

export const requestPasswordReset = async (email: string) => {
  if (!email) return { status: 400, message: "Email is required to request password reset" };
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { status: 404, message: "User not found" };
  const code = generateCode();
  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      code,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    },
  });
  await sendResetEmail(email, code);
  return `Reset code sent to ${email}`;
}

export const verifyResetCode = async (email: string, code: string) => {
  if (!email) return { status: 400, message: "Email is required to verify reset code" };
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { status: 404, message: "User not found" };

  const reset = await prisma.passwordReset.findFirst({
    where: {
      userId: user.id,
      code,
      used: false,
      expiresAt: { gt: new Date() },
    },
  });

  if (!reset) throw new Error("Invalid or expired code");

  // mark code as used
  await prisma.passwordReset.update({
    where: { id: reset.id },
    data: { used: true },
  });

  return "Code verified successfully";
};

export const changePassword = async (email: string, oldPassword: string, newPassword: string, id: string) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return { status: 404, message: "User not found" };

  const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!isMatch) return { status: 401, message: "Old password is incorrect" };

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: passwordHash },
  });

  return "Password changed successfully";
};
