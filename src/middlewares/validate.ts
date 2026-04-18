import { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";

declare module "express-serve-static-core" {
    interface Request {
        file?: any;
    }
}

function formatZodIssues(issues: { path?: unknown; message: string }[]) {
    return issues.map((err) => ({
        path: Array.isArray(err.path) ? err.path.join(".") : String(err.path ?? ""),
        message: err.message,
    }));
}

const validate =
    (schema: ZodType, source: "body" | "params" | "query" | "file" = "body") =>
        (req: Request, res: Response, next: NextFunction) => {
            try {
                const raw =
                    source === "file" ? req.file : (req as any)[source];

                const result = schema.safeParse(raw);

                if (!result.success) {
                    return res.status(400).json({
                        message: "Validation error",
                        errors: formatZodIssues(result.error.issues),
                    });
                }

                // Express 5: assigning `req.query` is unreliable (getter); keep raw query strings.
                // Services already coerce with Number(), etc. Validation still rejects bad input.
                if (source === "body" || source === "params") {
                    (req as any)[source] = result.data;
                }

                next();
            } catch (error: unknown) {
                const message =
                    error instanceof Error ? error.message : "Validation failed";
                return res.status(500).json({
                    message: message || "Internal validation error",
                });
            }
        };

export default validate;
