import { ModulesSdkUtils } from "@medusajs/framework/utils";

export type Connection = ReturnType<typeof ModulesSdkUtils.createPgConnection>;
