// @ts-nocheck
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

interface EmployeeData {
  employeeId: string;
  fullName: string;
  dateOfBirth?: string;
  position?: string;
  department?: string;
  gender?: string;
  email: string;
  role?: "ADMIN" | "LEADER" | "STAFF";
}

export async function importEmployees() {
  console.log("👥 Importing employees...");

  // Employee data from Excel/CSV
  // Format: { employeeId, fullName, dateOfBirth, position, department, gender, email }
  const employees: EmployeeData[] = [
    {
      employeeId: "S01",
      fullName: "Bùi Thị An",
      position: "Giám đốc điều hành",
      department: "Ban Giám đốc",
      gender: "Nữ",
      email: "an@bcagency.vn",
      role: "ADMIN"
    },
    {
      employeeId: "TE99",
      fullName: "Hoàng Nam",
      position: "Giám đốc công nghệ",
      department: "Ban Giám đốc",
      gender: "Nam",
      email: "nam@bcagency.vn",
      role: "ADMIN"
    },
    {
      employeeId: "TE03",
      fullName: "Trần Đức Hoàn",
      position: "Nhân viên Design",
      department: "Marketing",
      gender: "Nam",
      email: "hoantd@bcagency.vn",
      role: "STAFF"
    },
    {
      employeeId: "TE04",
      fullName: "Tô Văn Hoàng",
      position: "Nhân viên Digital",
      department: "Marketing",
      gender: "Nam",
      email: "hoangtv@bcagency.vn",
      role: "STAFF"
    },
    {
      employeeId: "CS02",
      fullName: "Nguyễn Thu Trà My",
      position: "Nhân viên Chăm sóc khách hàng",
      department: "CSKH",
      gender: "Nữ",
      email: "myntt@bcagency.vn",
      role: "STAFF"
    },
    {
      employeeId: "S03",
      fullName: "Nguyễn Mạnh Toàn",
      position: "Nhân viên Sales",
      department: "Kinh doanh",
      gender: "Nam",
      email: "toannm@bcagency.vn",
      role: "STAFF"
    },
    {
      employeeId: "S08",
      fullName: "Trần Xuân Quang",
      position: "Nhân viên Sales",
      department: "Kinh doanh",
      gender: "Nam",
      email: "quangtx@bcagency.vn",
      role: "STAFF"
    },
    {
      employeeId: "S09",
      fullName: "Trịnh Thị Kim Dung",
      position: "Nhân viên Sales",
      department: "Kinh doanh",
      gender: "Nữ",
      email: "dungttk@bcagency.vn",
      role: "STAFF"
    },
    {
      employeeId: "S12",
      fullName: "Phạm Minh Ngọc",
      position: "Trưởng phòng Kinh doanh",
      department: "Kinh doanh",
      gender: "Nữ",
      email: "ngocpm@bcagency.vn",
      role: "LEADER"
    },
    {
      employeeId: "HR01",
      fullName: "Lê Thị Mỹ Hạnh",
      position: "Nhân viên HCNS",
      department: "HCNS",
      gender: "Nữ",
      email: "hanhltm@bcagency.vn",
      role: "LEADER"
    },
    {
      employeeId: "S20",
      fullName: "Hoàng Thị Thu Trang",
      position: "Giám đốc Kinh doanh",
      department: "Kinh doanh",
      gender: "Nữ",
      email: "tranghtt@bcagency.vn",
      role: "LEADER"
    },
    {
      employeeId: "TE06",
      fullName: "Vũ Hồng Sơn",
      position: "Nhân viên Digital",
      department: "Marketing",
      gender: "Nam",
      email: "sonvh@bcagency.vn",
      role: "LEADER"
    },
    {
      employeeId: "TE07",
      fullName: "Ma Thị Hương Trà",
      position: "Nhân viên Content",
      department: "Marketing",
      gender: "Nữ",
      email: "tramth@bcagency.vn",
      role: "STAFF"
    },
    {
      employeeId: "HR04",
      fullName: "Nguyễn Phương Trang",
      position: "Nhân viên HCNS",
      department: "HCNS",
      gender: "Nữ",
      email: "trangnp@bcagency.vn",
      role: "STAFF"
    },
    {
      employeeId: "KT03",
      fullName: "Đặng Thị Xoan",
      position: "Nhân viên Kế toán",
      department: "Kế toán",
      gender: "Nữ",
      email: "xoandt@bcagency.vn",
      role: "LEADER"
    },
    {
      employeeId: "A10",
      fullName: "Nguyễn Tiến Thắng",
      position: "Thực tập sinh Account",
      department: "Kinh doanh",
      gender: "Nam",
      email: "thangnt@bcagency.vn",
      role: "STAFF"
    },
    {
      employeeId: "A22",
      fullName: "Đinh Tiến Phúc",
      position: "Thực tập sinh Account",
      department: "Kinh doanh",
      gender: "Nam",
      email: "phucdt@bcagency.vn",
      role: "STAFF"
    },
    {
      employeeId: "S26",
      fullName: "Đặng Anh Vũ",
      position: "Nhân viên Sales",
      department: "Kinh doanh",
      gender: "Nam",
      email: "vuda@bcagency.vn",
      role: "STAFF"
    },
    {
      employeeId: "A28",
      fullName: "Phạm Khánh Linh",
      position: "Thực tập sinh Account",
      department: "Marketing",
      gender: "Nữ",
      email: "linhpk@bcagency.vn",
      role: "STAFF"
    },
  ];

  if (employees.length === 0) {
    console.log("⚠️  No employees to import. Please add employee data to the array.");
    return;
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const emp of employees) {
    try {
      // Skip if email is missing
      if (!emp.email || !emp.fullName) {
        console.log(`⚠️  Skipping ${emp.employeeId}: Missing email or name`);
        skipped++;
        continue;
      }

      // Find team by department name
      let teamId: string | null = null;
      if (emp.department) {
        // Map department aliases to team names
        let searchTerm = emp.department;
        const departmentAliases: Record<string, string> = {
          "CSKH": "Chăm sóc khách hàng",
          "HR": "Hành chính nhân sự",
          "HCNS": "Hành chính nhân sự",
          "IT": "IT",
        };
        if (departmentAliases[emp.department]) {
          searchTerm = departmentAliases[emp.department];
        }
        
        const team = await prisma.team.findFirst({
          where: {
            name: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
        });
        if (team) {
          teamId = team.id;
        }
      }

      // Parse date of birth
      let dateOfBirth: Date | null = null;
      if (emp.dateOfBirth && !emp.dateOfBirth.includes("#REF")) {
        try {
          // Format: DD/MM/YYYY
          const [day, month, year] = emp.dateOfBirth.split("/");
          if (day && month && year) {
            dateOfBirth = new Date(`${year}-${month}-${day}`);
          }
        } catch (e) {
          // Invalid date, skip
        }
      }

      // Default password: employeeId@123 (or email prefix)
      const defaultPassword = `${emp.employeeId}@123` || `${emp.email.split("@")[0]}@123`;
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      // Determine role - use explicit role if provided, otherwise detect from position
      let role: Role = Role.STAFF;
      if (emp.role) {
        role = Role[emp.role];
      } else if (emp.position) {
        const positionLower = emp.position.toLowerCase();
        if (positionLower.includes("giám đốc") || positionLower.includes("trưởng phòng") || positionLower.includes("leader")) {
          role = Role.LEADER;
        } else if (positionLower.includes("admin") || positionLower.includes("quản trị")) {
          role = Role.ADMIN;
        }
      }

      // Create or update user
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

      if (user) {
        console.log(`✅ ${emp.employeeId}: ${emp.fullName} (${emp.email}) - ${role}`);
        created++;
      }
    } catch (error: any) {
      console.error(`❌ Error importing ${emp.employeeId}:`, error.message);
      skipped++;
    }
  }

  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅ Import Complete!");
  console.log(`   Created/Updated: ${created}`);
  console.log(`   Skipped: ${skipped}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
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

