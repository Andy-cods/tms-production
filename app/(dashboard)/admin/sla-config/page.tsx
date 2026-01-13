import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SlaConfigAdminClient } from "./_components/SlaConfigAdminClient";

export default async function AdminSlaConfigPage() {
	const session = await auth();
	const user = session?.user as any;
	if (!user?.role || user.role !== "ADMIN") {
		redirect("/403");
	}

	const configs = await prisma.slaConfig.findMany({
		orderBy: [{ targetEntity: "asc" }, { name: "asc" }],
	});

	const categories = await prisma.category.findMany({
		select: { id: true, name: true },
		orderBy: { name: "asc" },
	});

	return (
		<SlaConfigAdminClient configs={configs as any} categories={categories} />
	);
}
