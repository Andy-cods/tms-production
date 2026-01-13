// @ts-nocheck
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

interface EmployeeData {
  employeeId: string;
  fullName: string;
  dateOfBirth?: string;
  position?: string;
  department?: string;
  gender?: string;
  email: string;
  role?: string;
}

function parseCSV(filePath: string): EmployeeData[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n").filter((line) => line.trim());
  const headers = lines[0].split(",").map((h) => h.trim());

  const employees: EmployeeData[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    const emp: any = {};

    headers.forEach((header, index) => {
      const value = values[index] || "";
      // Skip empty values, #REF! errors, and "—" (em dash)
      if (value && !value.includes("#REF") && value !== "null" && value !== "NULL" && value !== "—" && value.trim() !== "") {
        emp[header] = value.trim();
      }
    });

    // Only add if has email and name
    if (emp.email && emp.fullName) {
      employees.push(emp as EmployeeData);
    }
  }

  return employees;
}

async function importEmployees() {
  console.log("👥 Importing employees from CSV...");

  const csvPath = path.join(process.cwd(), "employees.csv");

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ File not found: ${csvPath}`);
    console.log("   Please create employees.csv file with employee data");
    return;
  }

  const employees = parseCSV(csvPath);
  console.log(`📋 Found ${employees.length} employees to import`);

  if (employees.length === 0) {
    console.log("⚠️  No valid employees found in CSV");
    return;
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const emp of employees) {
    try {
      // Skip if email or name is missing
      if (!emp.email || !emp.fullName) {
        console.log(`⚠️  Skipping: Missing email or name`);
        skipped++;
        continue;
      }

      // Find team by department name
      let teamId: string | null = null;
      if (emp.department) {
        // Map department names to team names
        const departmentMap: Record<string, string> = {
          "Marketing": "Phòng Marketing",
          "CSKH": "Phòng Chăm sóc khách hàng",
          "Kinh doanh": "Phòng Kinh doanh", // May need to check actual team name
          "HCNS": "Phòng HR",
          "Kế toán": "Phòng Kế toán",
          "Ban Giám đốc": "Ban Giám đốc", // May not have a team
        };

        const teamName = departmentMap[emp.department] || emp.department;
        
        const team = await prisma.team.findFirst({
          where: {
            OR: [
              { name: { contains: teamName, mode: "insensitive" } },
              { name: { contains: emp.department, mode: "insensitive" } },
            ],
          },
        });
        if (team) {
          teamId = team.id;
        } else {
          console.log(`⚠️  Team not found for department: ${emp.department}`);
        }
      }

      // Parse date of birth
      let dateOfBirth: Date | null = null;
      if (emp.dateOfBirth) {
        try {
          // Format: DD/MM/YYYY
          const [day, month, year] = emp.dateOfBirth.split("/");
          if (day && month && year) {
            dateOfBirth = new Date(`${year}-${month}-${day}`);
            if (isNaN(dateOfBirth.getTime())) {
              dateOfBirth = null;
            }
          }
        } catch (e) {
          // Invalid date, skip
        }
      }

      // Default password: employeeId@123 or email prefix@123
      let passwordPrefix = emp.employeeId;
      if (!passwordPrefix || passwordPrefix === "—" || passwordPrefix.trim() === "") {
        passwordPrefix = emp.email.split("@")[0];
      }
      const defaultPassword = `${passwordPrefix}@123`;
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      // Determine role - use role from CSV if provided, otherwise infer from position
      let role: Role = Role.STAFF;
      if (emp.role) {
        const roleUpper = emp.role.toUpperCase();
        if (roleUpper === "ADMIN") {
          role = Role.ADMIN;
        } else if (roleUpper === "LEADER") {
          role = Role.LEADER;
        } else {
          role = Role.STAFF;
        }
      } else if (emp.position) {
        const positionLower = emp.position.toLowerCase();
        if (
          positionLower.includes("giám đốc") ||
          positionLower.includes("trưởng phòng") ||
          positionLower.includes("leader") ||
          positionLower.includes("quản lý")
        ) {
          role = Role.LEADER;
        } else if (positionLower.includes("admin") || positionLower.includes("quản trị")) {
          role = Role.ADMIN;
        }
      }

      // Create or update user
      const existingUser = await prisma.user.findUnique({
        where: { email: emp.email },
      });

      const user = await prisma.user.upsert({
        where: { email: emp.email },
        update: {
          name: emp.fullName,
          teamId: teamId || undefined,
          role: role,
          isActive: true,
        },
        create: {
          email: emp.email,
          name: emp.fullName,
          password: hashedPassword,
          role: role,
          teamId: teamId || undefined,
          isActive: true,
        },
      });

      if (existingUser) {
        console.log(`✅ Updated: ${emp.fullName} (${emp.email}) - ${role} - Team: ${emp.department || "None"}`);
        updated++;
      } else {
        console.log(`✅ Created: ${emp.fullName} (${emp.email}) - ${role} - Password: ${defaultPassword} - Team: ${emp.department || "None"}`);
        created++;
      }
    } catch (error: any) {
      console.error(`❌ Error importing ${emp.email}:`, error.message);
      skipped++;
    }
  }

  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅ Import Complete!");
  console.log(`   Created: ${created}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");
  console.log("📋 Default password format: {employeeId}@123");
  console.log("   Example: S01@123, TE99@123");
  console.log("");
}

async function main() {
  await importEmployees();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

