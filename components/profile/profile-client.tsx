"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Shield, Users, Calendar, Phone, MessageCircle } from "lucide-react";
import { format } from "date-fns";

interface ProfileClientProps {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
    teamId: string | null;
    phone?: string | null;
    telegramUsername?: string | null;
    createdAt: Date;
    team: {
      id: string;
      name: string;
    } | null;
  };
}

export default function ProfileClient({ user }: ProfileClientProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="space-y-6">
      {/* Profile Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Your basic account information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-[#37B24D] text-white flex items-center justify-center text-3xl font-bold">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h3 className="text-xl font-semibold">{user.name}</h3>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid gap-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
              <User className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Full Name</p>
                <p className="font-medium">{user.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
              <Mail className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
              <Shield className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="font-medium">{user.role}</p>
              </div>
            </div>

            {user.team && (
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                <Users className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Team</p>
                  <p className="font-medium">{user.team.name}</p>
                </div>
              </div>
            )}

            {user.phone && (
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                <Phone className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{user.phone}</p>
                </div>
              </div>
            )}

            {user.telegramUsername && (
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                <MessageCircle className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Telegram</p>
                  <a 
                    href={`https://t.me/${user.telegramUsername.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary-600 hover:underline"
                  >
                    {user.telegramUsername}
                  </a>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
              <Calendar className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Member Since</p>
                <p className="font-medium">
                  {format(new Date(user.createdAt), "MMMM d, yyyy")}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={() => setIsEditing(!isEditing)}
              variant="outline"
            >
              Edit Profile
            </Button>
            <Button variant="outline">
              Change Password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button 
            variant="ghost" 
            className="w-full justify-start"
            onClick={() => window.location.href = '/profile/absence'}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Absence Management
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start"
            onClick={() => window.location.href = '/my-tasks'}
          >
            <User className="w-4 h-4 mr-2" />
            My Tasks
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
