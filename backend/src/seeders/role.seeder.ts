import "dotenv/config";
import mongoose from "mongoose";
import connectDatabase from "../config/database.config";
import RoleModel from "../modules/member/role-permission.model";
import { RolePermissions } from "../common/utils/role-permission";

const seedRoles = async () => {
  console.log("Seeding roles started...");

  try {
    await connectDatabase();

    console.log("Syncing roles and permissions...");

    for (const roleName in RolePermissions) {
      const role = roleName as keyof typeof RolePermissions;
      const permissions = RolePermissions[role];

      const updatedRole = await RoleModel.findOneAndUpdate(
        { name: role },
        { name: role, permissions: permissions },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`Role ${role} synced with ${permissions.length} permissions.`);
    }

    console.log("Seeding completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Error during seeding:", error);
    process.exit(1);
  }
};

seedRoles().catch((error) => {
  console.error("Error running seed script:", error);
  process.exit(1);
});
