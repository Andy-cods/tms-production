import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { PetDisplay } from "@/components/gamification/pet-display";

export default async function GamingDashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gaming</h1>
          <p className="text-sm text-gray-500 mt-1">Your gamification dashboard</p>
        </div>
        <Link href="/dashboard" className="text-primary-600 underline">Back to Dashboard</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Pet</CardTitle>
          </CardHeader>
          <CardContent>
            <PetDisplay />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

